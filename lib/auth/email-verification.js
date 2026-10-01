import crypto from 'crypto';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashVerificationToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

export function getVerificationExpiry() {
  return new Date(Date.now() + 30 * 60 * 1000);
}