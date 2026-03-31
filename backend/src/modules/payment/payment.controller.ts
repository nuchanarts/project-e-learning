import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { paymentService } from './payment.service';

export const paymentController = {
  async checkAccess(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const hasAccess = await paymentService.hasAccess(req.user!.id, req.params.courseId);
      res.json({ hasAccess });
    } catch (err) {
      next(err);
    }
  },

  async purchase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { card } = req.body;
      if (!card) return res.status(400).json({ message: 'Card information required' });
      const order = await paymentService.purchaseCourse(req.user!.id, req.params.courseId, card);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  async myOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await paymentService.listUserOrders(req.user!.id));
    } catch (err) {
      next(err);
    }
  },

  async adminOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      res.json(await paymentService.listAllOrders(search));
    } catch (err) {
      next(err);
    }
  },
};
