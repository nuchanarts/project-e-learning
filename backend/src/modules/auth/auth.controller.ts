import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json(tokens);
    } catch (err) { next(err); }
  },

  logout(_req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
  },
};
