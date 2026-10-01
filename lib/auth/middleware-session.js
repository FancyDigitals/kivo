import { jwtVerify } from 'jose';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'kivo_super_secret_jwt_key_min_32_chars_2025';

const secret = new TextEncoder().encode(JWT_SECRET);

export async function verifyMiddlewareToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (!payload?.userId || !payload?.workspaceId) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[MIDDLEWARE JWT ERROR]', error);
    return null;
  }
}