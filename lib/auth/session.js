import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'kivo_super_secret_jwt_key_min_32_chars_2025';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// 100% backwards-compatible: passwordHash is optional
export function signJwtToken(payload, passwordHash = '') {
  const pwdSig = passwordHash ? passwordHash.slice(-12) : '';
  return jwt.sign({ ...payload, pwdSig }, JWT_SECRET, { expiresIn: '7d' });
}

// Checks if token signature matches the user's current password in DB
export function verifyJwtToken(token, currentPasswordHash = null) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (currentPasswordHash && decoded.pwdSig) {
      const expectedSig = currentPasswordHash.slice(-12);
      if (decoded.pwdSig !== expectedSig) {
        return null; // Password was changed! Token is invalid.
      }
    }
    return decoded;
  } catch (err) {
    return null;
  }
}