// import { AuthService } from '@/lib/auth';
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//     service: process.env.SMTP_SERVICE || 'gmail',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

// import type { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { email, name } = req.body;

//   if (!email || !email.includes('@')) {
//     return res.status(400).json({ message: 'Valid email is required' });
//   }

//   try {
//     // Create or update user
//     await AuthService.createOrUpdateUser(email, name);

//     // Create OTP
//     const otp = await AuthService.createOTP(email);

//     // Send email
//     await transporter.sendMail({
//       from: process.env.FROM_EMAIL,
//       to: email,
//       subject: 'Your Sign-in Code',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="text-align: center; margin-bottom: 30px;">
//             <h1 style="color: #2563eb; margin-bottom: 10px;">Your Sign-in Code</h1>
//             <p style="color: #666; font-size: 16px;">Use this code to sign in to your account</p>
//           </div>

//           <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
//             <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
//               <h2 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp.code}</h2>
//             </div>
//           </div>

//           <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <p style="color: #666; margin: 0; font-size: 14px;">
//               <strong>⏰ This code will expire in 5 minutes</strong><br>
//               🔒 If you didn't request this code, please ignore this email<br>
//               💡 For security, never share this code with anyone
//             </p>
//           </div>

//           <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
//             <p style="color: #999; font-size: 12px;">
//               This email was sent from a secure, monitored system. Please do not reply to this email.
//             </p>
//           </div>
//         </div>
//       `,
//     });

//     return res.status(200).json({ 
//       message: 'OTP sent successfully',
//       success: true 
//     });

//   } catch (error) {
//     console.error('Send OTP error:', error);
//     return res.status(500).json({ 
//       message: 'Failed to send OTP',
//       success: false 
//     });
//   }
// }

import { AuthService } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { SessionStatus } from '@/types';

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  const body = await request.json();
  const { email, name } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Valid email is required' }, { status: 400 });
  }

  try {
    // Create or update user
    await AuthService.createOrUpdateUser(email, name);

    // Step 2: Check for existing DRAFT session
    const existingDraftSession = await AuthService.findDraftSessionByEmail(email);
    console.log("🚀 ~ POST ~ existingDraftSession:", existingDraftSession)

    if (existingDraftSession?.status == SessionStatus.DRAFT) {

      // Get user
      const user = await AuthService.createOrUpdateUser(email);

      // Clean up expired sessions
      // await AuthService.cleanupExpiredSessions();

      // Set HTTP-only cookie using NextResponse
      const response = NextResponse.json({
        message: 'Authentication successful',
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
      response.cookies.set('auth-token', existingDraftSession.token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      return response;
    } else {
      // Create OTP
      const otp = await AuthService.createOTP(email);

      // Send email
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your Sign-in Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Your Sign-in Code</h1>
              <p style="color: #666; font-size: 16px;">Use this code to sign in to your account</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <h2 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp.code}</h2>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>⏰ This code will expire in 5 minutes</strong><br>
                🔒 If you didn't request this code, please ignore this email<br>
                💡 For security, never share this code with anyone
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This email was sent from a secure, monitored system. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({
        message: 'OTP sent successfully',
        success: true
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({
      message: 'Failed to send OTP',
      success: false
    }, { status: 500 });
  }
}