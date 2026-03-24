import { Router } from 'express';
import { courseController } from './course.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', courseController.list);
router.get('/:id', courseController.getById);
export default router;
