import crypto from 'crypto';

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashPasswordResetToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

export function getPasswordResetExpiry() {
  const expiry = new Date();

  // Password reset links expire after 30 minutes.
  expiry.setMinutes(expiry.getMinutes() + 30);

  return expiry;
}
