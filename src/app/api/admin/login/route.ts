import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Replace with your real admin check
  if (email === 'admin@example.com' && password === 'admin123') {
    const session = { userId: 'admin-id', role: 'admin' };
    const sessionString = Buffer.from(JSON.stringify(session)).toString('base64');

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', sessionString, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}