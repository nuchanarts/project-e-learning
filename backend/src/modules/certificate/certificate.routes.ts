import { Router } from 'express';
import { certificateController } from './certificate.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', certificateController.list);
router.get('/:courseId', certificateController.getOrGenerate);
router.get('/:courseId/download', certificateController.download);
export default router;
