import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/login-by-cid', authController.loginByCid);
router.post('/moph/callback', authController.mophCallback);
router.post('/moph/complete', authController.mophComplete);
router.post('/otp/verify', authController.verifyOtp);
router.post('/otp/resend', authController.resendOtp);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.put('/me', authenticate, authController.updateMe);

// Admin: toggle OTP
router.post('/otp/toggle', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const { default: prisma } = await import('../../lib/prisma');
    await prisma.siteSetting.upsert({
      where: { key: 'otp_enabled' },
      update: { value: JSON.stringify(!!enabled) },
      create: { key: 'otp_enabled', value: JSON.stringify(!!enabled) },
    });
    res.json({ ok: true, otpEnabled: !!enabled });
  } catch (err) {
    next(err);
  }
});

// Admin: get OTP status
router.get('/otp/status', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const { default: prisma } = await import('../../lib/prisma');
    const row = await prisma.siteSetting.findUnique({ where: { key: 'otp_enabled' } });
    const enabled = row ? JSON.parse(row.value) === true : false;
    res.json({ otpEnabled: enabled });
  } catch (err) {
    next(err);
  }
});

export default router;
