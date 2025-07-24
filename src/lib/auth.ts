import { prisma } from './prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class AuthService {
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async createOrUpdateUser(email: string, name = null) {
    return await prisma.user.upsert({
      where: { email },
      update: { 
        updatedAt: new Date(),
        isActive: true 
      },
      create: { 
        email, 
        name,
        isActive: true 
      },
    });
  }

  static async createOTP(email: string) {
    // Clean up expired OTPs for this email
    await prisma.oTP.deleteMany({
      where: {
        email,
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    });

    // Generate new OTP
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otp = await prisma.oTP.create({
      data: {
        email,
        code,
        expiresAt,
        attempts: 0,
        used: false
      }
    });

    return otp;
  }

  static async verifyOTP(email: string, code: string) {
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        used: false,
        // expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("🚀 ~ AuthService ~ verifyOTP ~ otp:", otp)

    if (!otp) {
      // Check if there's an OTP for this email to increment attempts
      const existingOTP = await prisma.oTP.findFirst({
        where: {
          email,
          used: false,
          expiresAt: { gt: new Date() }
        }
      });

      if (existingOTP) {
        await prisma.oTP.update({
          where: { id: existingOTP.id },
          data: { attempts: { increment: 1 } }
        });

        // Delete OTP if too many attempts
        if (existingOTP.attempts >= 2) { // 3 total attempts
          await prisma.oTP.delete({
            where: { id: existingOTP.id }
          });
        }
      }

      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true }
    });

    return { success: true, otp };
  }

  static async createSession(userId: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });

    return token;
  }

  // static async cleanupExpiredSessions() {
  //   await prisma.session.deleteMany({
  //     where: {
  //       expiresAt: { lt: new Date() }
  //     }
  //   });
  // }

  static async getUserFromToken(token: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      console.log("decoded : ", decoded)

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || !session.expiresAt || session.expiresAt < new Date()) {
        return null;
      }

      return session.user;
    } catch (error) {
      console.log("🚀 ~ AuthService ~ getUserFromToken ~ error:", error)
      return null;
    }
  }

  static async findDraftSessionByEmail(email: string) {
    return prisma.session.findFirst({
      where: {
        user: { email },
        status: 'DRAFT'
      }
    });
  }
}