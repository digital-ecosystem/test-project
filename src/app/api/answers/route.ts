import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { questionId, answer } = await request.json();
    if (!questionId || !answer ) {
      return NextResponse.json({ message: 'Missing questionId, or answer' }, { status: 400 });
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const session = await prisma.session.findFirst({
        where: { userId: user.id, status: 'DRAFT' },
        orderBy: { id: "asc" }
      });
      
      if (!session) {
        return NextResponse.json({ message: "No active session found" }, { status: 404 });
      }
      
      const sessionId = session.id;

    const newAnswer = await prisma.answer.create({
      data: {
        id: uuidv4(),
        sessionId,
        questionId,
        value: answer,
        // createdAt will be set automatically if using @default(now())
      }
    });

    return NextResponse.json({ success: true, answer: newAnswer });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}