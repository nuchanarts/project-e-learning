import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', dashboardController.get);
router.get('/analytics', requireAdmin, dashboardController.getAnalytics);
export default router;
