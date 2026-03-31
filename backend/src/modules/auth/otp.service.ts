import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import prisma from '../../lib/prisma';

const OTP_TTL_MINUTES = 10;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function isOtpEnabled(): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'otp_enabled' } });
  if (!row) return process.env.OTP_ENABLED === 'true';
  try {
    return JSON.parse(row.value) === true;
  } catch {
    return false;
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const otpService = {
  isOtpEnabled,

  async sendOtp(email: string): Promise<void> {
    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Invalidate old OTPs for this email
    await prisma.otpCode.updateMany({ where: { email, used: false }, data: { used: true } });

    await prisma.otpCode.create({ data: { email, codeHash, expiresAt } });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@rpst-learning.go.th',
      to: email,
      subject: `[รพ.สต. Learning Hub] รหัส OTP ของคุณ`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#7B68EE">🏥 รพ.สต. Learning Hub</h2>
          <p>รหัส OTP สำหรับเข้าสู่ระบบของคุณ:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#7B68EE;padding:20px;background:#F5F3FF;border-radius:12px;text-align:center">
            ${code}
          </div>
          <p style="color:#6B7280;font-size:13px;margin-top:16px">รหัสนี้หมดอายุใน ${OTP_TTL_MINUTES} นาที กรุณาอย่าเปิดเผยแก่ผู้อื่น</p>
        </div>`,
    });
  },

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const record = await prisma.otpCode.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return false;
    const match = await bcrypt.compare(code, record.codeHash);
    if (match) {
      await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
    }
    return match;
  },
};
