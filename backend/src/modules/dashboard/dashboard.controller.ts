import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getForUser(req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  },
};
