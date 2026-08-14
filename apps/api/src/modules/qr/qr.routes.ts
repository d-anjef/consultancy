import { Router } from 'express';
import { qrService } from './qr.service.js';
import { sendSuccess } from '../../lib/response.js';
import { UnauthorizedError, NotFoundError } from '../../lib/errors.js';
import { ROLE_CODES } from '@consultancy/config';

const router: Router = Router();

router.get('/me', async (req, res, next) => {
  try {
    if (!req.currentUser) throw new UnauthorizedError();

    let userType: 'STUDENT' | 'TEACHER';
    if (req.currentUser.role.code === ROLE_CODES.STUDENT) {
      userType = 'STUDENT';
    } else if (req.currentUser.role.code === ROLE_CODES.TEACHER) {
      userType = 'TEACHER';
    } else {
      throw new NotFoundError('QR is only for students and teachers');
    }

    const result = await qrService.getOrCreate(req.currentUser.id, userType);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.post('/me/rotate', async (req, res, next) => {
  try {
    if (!req.currentUser) throw new UnauthorizedError();

    let userType: 'STUDENT' | 'TEACHER';
    if (req.currentUser.role.code === ROLE_CODES.STUDENT) {
      userType = 'STUDENT';
    } else if (req.currentUser.role.code === ROLE_CODES.TEACHER) {
      userType = 'TEACHER';
    } else {
      throw new NotFoundError('QR is only for students and teachers');
    }

    const result = await qrService.rotate(req.currentUser.id, userType);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

export { router as qrRoutes };