import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Find the DRAFT session
    const session = await prisma.session.findFirst({
      where: { userId: user.id, status: 'DRAFT' },
      orderBy: { id: "asc" }
    });

    let answers: Record<string, string> = {};
    if (session) {
      const answerRows = await prisma.answer.findMany({
        where: { sessionId: session.id }
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      answers = answerRows.reduce((acc, ans) => {
        acc[ans.questionId] = ans.value;
        return acc;
      }, {} as Record<string, string>);
    }

    const questions = await prisma.question.findMany({
      include: { options: true },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({ success: true, questions, answers });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ message: "Failed to fetch sessions", success: false }, { status: 500 });
  }
}