import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';

export const progressController = {
  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { videoId, courseId, percent } = req.body;
      const result = await progressService.saveProgress(userId, videoId, courseId, percent);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getForCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;
      const progress = await progressService.getUserProgress(userId, courseId);
      res.json(progress);
    } catch (err) { next(err); }
  },
};
