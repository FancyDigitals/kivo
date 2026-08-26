import { verifyJwtToken } from './session';

/**
 * Extracts and verifies the current session's tenant workspaceId from HttpOnly JWT cookie.
 */
export async function getAuthContext(request) {
  try {
    const token = request.cookies.get('kivo_session')?.value;
    if (!token) {
      return { userId: null, workspaceId: 'ws_fancy_1', role: 'guest' };
    }

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.workspaceId) {
      return { userId: null, workspaceId: 'ws_fancy_1', role: 'guest' };
    }

    return {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      email: decoded.email,
      role: decoded.role || 'user',
    };
  } catch (err) {
    return { userId: null, workspaceId: 'ws_fancy_1', role: 'guest' };
  }
}