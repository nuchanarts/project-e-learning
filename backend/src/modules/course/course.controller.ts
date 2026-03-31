import { Request, Response, NextFunction } from 'express';
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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await courseService.getById(req.params.id);
      res.json(course);
    } catch (err) {
      next(err);
    }
  },
};
