import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const cookie = (await cookies()).get('session')?.value;
    const session = await decrypt(cookie);
    console.log("🚀 ~ GET ~ session:", session)

    if (!session?.userId || session?.role !== 'admin') {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }


    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true },
        });

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const { id, email, createdAt } = session.user;

        return NextResponse.json({
            success: true,
            user: { id, email, createdAt }
        });
    } catch (error) {
        console.error('[GET /api/user]', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
