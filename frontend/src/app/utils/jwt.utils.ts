export interface JwtPayload {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  iat?: number;
  exp?: number;
}

/**
 * Decodes a JWT payload without external libraries.
 */
export function decodeJwt<T = JwtPayload>(token: string): T | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    // Convert base64url to base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT token is expired.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const payload = decodeJwt<JwtPayload>(token);
  if (!payload || !payload.exp) return false;

  // Add a 10 second clock-skew buffer
  const nowInSeconds = Math.floor(Date.now() / 1000) - 10;
  return nowInSeconds >= payload.exp;
}
