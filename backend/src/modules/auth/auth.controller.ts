import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { authService } from './auth.service';
import { otpService } from './otp.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, cid, hospital, position, hospcode } = req.body;
      const result = await authService.register(
        email,
        password,
        name,
        cid,
        hospital,
        position,
        hospcode,
      );
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

  async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, hospital, position, avatarUrl } = req.body;
      const user = await authService.updateProfile(req.user!.id, {
        name,
        hospital,
        position,
        avatarUrl: avatarUrl ?? undefined,
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async loginByCid(req: Request, res: Response, next: NextFunction) {
    try {
      const { hospcode, cid } = req.body;
      const result = await authService.loginByCid(hospcode, cid);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // MOPH Provider ID — step 1: exchange the OAuth code (login or ask to complete profile).
  async mophCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const result = await authService.loginWithMophCode(code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // MOPH Provider ID — step 2: complete a new account with the supplied email/cid.
  async mophComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { registrationToken, email, cid, hcode } = req.body;
      const result = await authService.completeMophRegistration({
        registrationToken,
        email,
        cid,
        hcode,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ ok: true, message: 'หากอีเมลนี้มีในระบบ รหัส OTP จะถูกส่งไปให้' });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      await authService.resetPassword(email, otp, newPassword);
      res.json({ ok: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
  },
};
