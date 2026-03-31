import express from 'express';
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
import { errorHandler } from './middleware/error.middleware';

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

app.use(errorHandler);

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
