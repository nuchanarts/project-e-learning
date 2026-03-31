import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { quizService } from './quiz.service';

export const quizController = {
  async getQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await quizService.getQuestions(req.params.courseId));
    } catch (err) {
      next(err);
    }
  },

  async submitAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { answers } = req.body;
      const result = await quizService.submitAttempt(req.user!.id, req.params.courseId, answers);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await quizService.getResult(req.user!.id, req.params.courseId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
