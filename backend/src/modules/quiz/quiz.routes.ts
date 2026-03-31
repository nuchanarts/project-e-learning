import { Router } from 'express';
import { quizController } from './quiz.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/:courseId', quizController.getQuestions);
router.post('/:courseId/attempt', quizController.submitAttempt);
router.get('/:courseId/result', quizController.getResult);
export default router;
