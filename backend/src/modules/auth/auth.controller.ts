import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { otpService } from './otp.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, cid, hospital, position } = req.body;
      const result = await authService.register(email, password, name, cid, hospital, position);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const otpEnabled = await otpService.isOtpEnabled();

      if (otpEnabled) {
        // Validate credentials only — don't return token yet
        await authService.validateCredentials(email, password);
        await otpService.sendOtp(email);
        res.json({ otpRequired: true });
      } else {
        const result = await authService.login(email, password);
        res.json(result);
      }
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const valid = await otpService.verifyOtp(email, otp);
      if (!valid) {
        res.status(401).json({ message: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ' });
        return;
      }
      const result = await authService.loginByEmail(email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await otpService.sendOtp(email);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
  },
};
