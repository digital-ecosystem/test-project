import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AuthService } from "@/lib/auth";

export async function PATCH(request: Request) {
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

    const { first_name, last_name, age } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: `${first_name} ${last_name}`,
        age: age,
        // add other fields as needed
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 });
  }
}