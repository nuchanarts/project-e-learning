import { Router } from 'express';
import { progressController } from './progress.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/', progressController.save);
router.get('/course/:courseId', progressController.getForCourse);
export default router;
