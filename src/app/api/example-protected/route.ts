import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export async function GET() {
  const cookie = (await cookies()).get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // ...your protected logic here...
  return NextResponse.json({ message: 'Success', userId: session.userId });
} 