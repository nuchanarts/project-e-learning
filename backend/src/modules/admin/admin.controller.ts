import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { adminService } from './admin.service';

export const adminController = {
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.getAnalytics());
    } catch (err) { next(err); }
  },

  async createCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;
      res.status(201).json(await adminService.createCourse({ title, description }));
    } catch (err) { next(err); }
  },

  async updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await adminService.updateCourse(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async deleteCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async addVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, url, duration, order } = req.body;
      res.status(201).json(await adminService.addVideo(req.params.courseId, { title, url, duration, order }));
    } catch (err) { next(err); }
  },

  async deleteVideo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteVideo(req.params.videoId);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
