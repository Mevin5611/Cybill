import type { RequestHandler } from 'express';
import {
  ADMIN_COOKIE,
  verifyAdminToken
} from '../services/adminAuth.js';

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[ADMIN_COOKIE];
  const admin = token ? verifyAdminToken(token) : null;

  if (!admin) {
    res.status(401).json({
      status: 'error',
      message: 'Admin login required'
    });
    return;
  }

  (req as any).admin = admin;
  next();
};