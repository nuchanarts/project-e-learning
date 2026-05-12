import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { trainingRecordService } from './training-record.service';

export const trainingRecordController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { courseId, recordDate, imageData, imageMimeType, notes } = req.body;

      if (!imageData) {
        res.status(400).json({ message: 'กรุณาแนบรูปภาพผลการปฏิบัติ' });
        return;
      }

      const record = await trainingRecordService.create(userId, {
        courseId: courseId || undefined,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        imageData,
        imageMimeType: imageMimeType || 'image/jpeg',
        notes: notes || undefined,
      });
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  },

  async getMyRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const records = await trainingRecordService.getMyRecords(req.user!.id);
      // Strip imageData for list view to reduce payload
      res.json(records.map(({ imageData: _, ...r }) => r));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await trainingRecordService.getById(
        req.params.id,
        req.user!.id,
        req.user!.role,
      );
      res.json(record);
    } catch (err) {
      next(err);
    }
  },

  // Admin: list all records
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const records = await trainingRecordService.getAllForAdmin(status);
      // Strip imageData for list view
      res.json(records.map(({ imageData: _, ...r }) => r));
    } catch (err) {
      next(err);
    }
  },

  // Admin: get one record with image
  async getOneAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await trainingRecordService.getById(
        req.params.id,
        req.user!.id,
        req.user!.role,
      );
      res.json(record);
    } catch (err) {
      next(err);
    }
  },

  // Admin: approve or reject
  async review(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, adminNote } = req.body;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({ message: 'status must be APPROVED or REJECTED' });
        return;
      }
      const record = await trainingRecordService.approveOrReject(
        req.params.id,
        status as 'APPROVED' | 'REJECTED',
        adminNote,
      );
      res.json(record);
    } catch (err) {
      next(err);
    }
  },

  async getByCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const records = await trainingRecordService.getByCourse(req.params.courseId);
      res.json(records.map(({ imageData: _, ...r }) => r));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await trainingRecordService.delete(req.params.id, req.user!.id, req.user!.role);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
