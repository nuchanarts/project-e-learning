import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { certificateService } from './certificate.service';
import fs from 'fs';

export const certificateController = {
  async getOrGenerate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cert = await certificateService.getOrGenerate(req.user!.id, req.params.courseId);
      res.json(cert);
    } catch (err) { next(err); }
  },

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cert = await certificateService.getOrGenerate(req.user!.id, req.params.courseId);
      if (!fs.existsSync(cert.filePath)) {
        return res.status(404).json({ message: 'Certificate file not found' });
      }
      res.download(cert.filePath);
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const certs = await certificateService.listForUser(req.user!.id);
      res.json(certs);
    } catch (err) { next(err); }
  },
};
