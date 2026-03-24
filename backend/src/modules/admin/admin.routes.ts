import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/analytics', adminController.getAnalytics);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.post('/courses/:courseId/videos', adminController.addVideo);
router.delete('/videos/:videoId', adminController.deleteVideo);

export default router;
