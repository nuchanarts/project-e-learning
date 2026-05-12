import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { trainingRecordController } from './training-record.controller';

const router = Router();
router.use(authenticate);

// User routes
router.post('/', trainingRecordController.create);
router.get('/my', trainingRecordController.getMyRecords);
router.get('/:id', trainingRecordController.getById);
router.delete('/:id', trainingRecordController.delete);

// Admin routes
router.get('/', requireAdmin, trainingRecordController.getAll);
router.put('/:id/review', requireAdmin, trainingRecordController.review);
router.get('/course/:courseId', requireAdmin, trainingRecordController.getByCourse);

export default router;
