import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';

const SESSION_SECONDS = 8 * 60 * 60; // 8 hours
export const ADMIN_COOKIE = 'admin_session';

function getConfig() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_JWT_SECRET;
  

  if (!username || !password || !secret) {
    throw new Error(
      'ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_JWT_SECRET must be set in .env'
    );
  }

  if (secret.length < 32) {
    throw new Error('ADMIN_JWT_SECRET must be at least 32 characters');
  }

  return { username, password, secret };
}

/**
 * Runs once at server startup. Makes sure the admin account in the
 * database matches ADMIN_USERNAME / ADMIN_PASSWORD from .env.
 * Changing the password in .env and restarting updates the stored hash.
 */
export async function ensureAdminAccount(): Promise<void> {
  const { username, password } = getConfig();

  const existing = await Admin.findOne({ username }).lean();

  if (existing && (await bcrypt.compare(password, existing.passwordHash))) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.updateOne(
    { username },
    { $set: { passwordHash } },
    { upsert: true }
  );

  console.log(`Admin account ready: ${username}`);
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const admin = await Admin.findOne({
    username: username.trim().toLowerCase()
  }).lean();

  if (!admin) return false;

  return bcrypt.compare(password, admin.passwordHash);
}

export function signAdminToken(username: string): string {
  return jwt.sign(
    { sub: username, role: 'admin' },
    getConfig().secret,
    { expiresIn: SESSION_SECONDS }
  );
}

export function verifyAdminToken(
  token: string
): { sub: string; role: 'admin' } | null {
  try {
    const payload = jwt.verify(token, getConfig().secret) as jwt.JwtPayload;

    if (payload.role !== 'admin') return null;

    return { sub: String(payload.sub), role: 'admin' };
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_SECONDS * 1000,
  path: '/'
};