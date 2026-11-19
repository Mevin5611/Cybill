import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { FEATURE_KEYS } from '../config/features.js';
import { listFeatures, setFeatureEnabled } from '../services/features.js';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  signAdminToken,
  verifyAdminCredentials
} from '../services/adminAuth.js';

const router = Router();

// Limit login attempts per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts. Try again in 15 minutes.'
  }
});

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200)
});

const toggleSchema = z.object({
  key: z.enum(FEATURE_KEYS),
  enabled: z.boolean()
});

/* ---------- Public auth routes (no login required) ---------- */

router.post(
  '/auth/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const valid = await verifyAdminCredentials(username, password);

    if (!valid) {
      throw new AppError(401, 'Invalid username or password');
    }

    const normalized = username.trim().toLowerCase();
    const token = signAdminToken(normalized);

    res.cookie(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);

    res.json({
      status: 'success',
      data: { username: normalized, role: 'admin' }
    });
  })
);

router.post('/auth/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
  res.json({ status: 'success' });
});

router.get(
  '/auth/me',
  requireAdminAuth,
  (req, res) => {
    res.json({
      status: 'success',
      data: (req as any).admin
    });
  }
);

/* ---------- Everything below requires an admin session ---------- */

router.use(requireAdminAuth);

router.get(
  '/features',
  asyncHandler(async (_req, res) => {
    res.json({
      status: 'success',
      data: await listFeatures()
    });
  })
);

router.put(
  '/features',
  asyncHandler(async (req, res) => {
    const { key, enabled } = toggleSchema.parse(req.body);

    await setFeatureEnabled(key, enabled, (req as any).admin?.sub);

    res.json({
      status: 'success',
      data: await listFeatures()
    });
  })
);

export default router;