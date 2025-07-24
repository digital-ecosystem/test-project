import { prisma } from '@/lib/prisma';
import { SessionStatus } from '@/types';
import { NextResponse } from 'next/server';
// import { PrismaClient, SessionStatus } from '@prisma/client';

// const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, status } = body;

    // Validate input
    if (!sessionId || !status) {
      return NextResponse.json(
        { success: false, error: 'sessionId and status are required' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!Object.values(SessionStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: 'Session status updated successfully',
      session: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/session/status]', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
