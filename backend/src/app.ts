import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes';
import courseRoutes from './modules/course/course.routes';
import progressRoutes from './modules/progress/progress.routes';
import certificateRoutes from './modules/certificate/certificate.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import helpRoutes from './modules/help/help.routes';
import paymentRoutes from './modules/payment/payment.routes';
import hospitalRoutes from './modules/hospital/hospital.routes';
import announcementsRoutes from './modules/admin/announcements.routes';
import statsRoutes from './modules/stats/stats.routes';
import ratingRoutes from './modules/rating/rating.routes';
import bundleRoutes from './modules/bundle/bundle.routes';
import trainingRecordRoutes from './modules/training-record/training-record.routes';
import { errorHandler } from './middleware/error.middleware';
import prisma from './lib/prisma';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/progress', progressRoutes);
app.use('/certificates', certificateRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes);
app.use('/help', helpRoutes);
app.use('/payment', paymentRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/announcements', announcementsRoutes);
app.use('/stats', statsRoutes);
app.use('/ratings', ratingRoutes);
app.use('/bundles', bundleRoutes);
app.use('/training-records', trainingRecordRoutes);

// Public site settings (categories, etc.)
app.get('/settings/public', async (_req: Request, res: Response) => {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: ['categories'] } } });
  const m: Record<string, string> = {};
  rows.forEach((r) => {
    m[r.key] = r.value;
  });
  res.json({ categories: m['categories'] ?? '' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
