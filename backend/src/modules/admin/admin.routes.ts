import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/analytics', adminController.getAnalytics);

// Courses
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Videos
router.post('/courses/:courseId/videos', adminController.addVideo);
router.delete('/videos/:videoId', adminController.deleteVideo);

// Quiz
router.get('/courses/:courseId/quiz', adminController.getQuizQuestions);
router.post('/courses/:courseId/quiz', adminController.createQuizQuestion);
router.put('/quiz/:questionId', adminController.updateQuizQuestion);
router.delete('/quiz/:questionId', adminController.deleteQuizQuestion);

// Documents
router.post('/courses/:courseId/documents', adminController.addDocument);
router.delete('/documents/:documentId', adminController.deleteDocument);

// Export
router.post('/export/sheets', adminController.exportSheets);
router.get('/export/excel', adminController.exportExcel);

export default router;
