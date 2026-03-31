import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/my-orders', paymentController.myOrders);
router.get('/access/:courseId', paymentController.checkAccess);
router.post('/purchase/:courseId', paymentController.purchase);

// Admin
router.get('/admin/orders', requireAdmin, paymentController.adminOrders);

export default router;
