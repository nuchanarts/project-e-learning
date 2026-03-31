import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { adminService } from './admin.service';
import { sheetsService } from './sheets.service';
import { excelService } from './excel.service';

export const adminController = {
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getAnalytics());
    } catch (err) {
      next(err);
    }
  },

  async createCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, category } = req.body;
      res.status(201).json(await adminService.createCourse({ title, description, category }));
    } catch (err) {
      next(err);
    }
  },

  async updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.updateCourse(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async reorderCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.reorderCourses(req.body.items);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async addVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, url, duration, order } = req.body;
      res
        .status(201)
        .json(await adminService.addVideo(req.params.courseId, { title, url, duration, order }));
    } catch (err) {
      next(err);
    }
  },

  async deleteVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteVideo(req.params.videoId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Quiz
  async getQuizQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getQuizQuestions(req.params.courseId));
    } catch (err) {
      next(err);
    }
  },

  async createQuizQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text, options, correctIndex, order } = req.body;
      res.status(201).json(
        await adminService.createQuizQuestion(req.params.courseId, {
          text,
          options,
          correctIndex,
          order,
        }),
      );
    } catch (err) {
      next(err);
    }
  },

  async updateQuizQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.updateQuizQuestion(req.params.questionId, req.body));
    } catch (err) {
      next(err);
    }
  },

  async deleteQuizQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteQuizQuestion(req.params.questionId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Documents
  async addDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, url, order } = req.body;
      res
        .status(201)
        .json(await adminService.addDocument(req.params.courseId, { title, url, order }));
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteDocument(req.params.documentId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // Export
  async exportSheets(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await sheetsService.exportKPI());
    } catch (err) {
      next(err);
    }
  },

  async exportExcel(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await excelService.generateLearnerReport();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="learners.xlsx"');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },
};
