import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { courseService } from './course.service';

export const courseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const courses = await courseService.list(category);
      res.json(courses);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const course = await courseService.getById(req.params.id, req.user?.id);
      res.json(course);
    } catch (err) {
      next(err);
    }
  },
};
