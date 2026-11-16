import crypto from 'crypto';

export interface JwtUserPayload {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  iat?: number;
  exp?: number;
}

const DEFAULT_JWT_SECRET = 'shareship_jwt_secret_key_v1_2026_secured';

// Set of revoked token hashes for instant in-memory checks
const revokedTokenHashes = new Set<string>();

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

/**
 * Base64URL encode a string or Buffer
 */
export function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

/**
 * Base64URL decode to string
 */
export function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

/**
 * Hash a token string for safe, compact storage and comparison
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Revokes a JWT, invalidating the session on the backend.
 */
export function revokeToken(token: string): void {
  if (!token) return;
  const hash = hashToken(token);
  revokedTokenHashes.add(hash);

  try {
    const payload = decodeJwt(token);
    const exp = payload?.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + 30 * 86400 * 1000);

    import('../models/revoked-token.model.js')
      .then(({ RevokedTokenModel }) => {
        RevokedTokenModel.create({ tokenHash: hash, expiresAt: exp }).catch(() => {});
      })
      .catch(() => {});
  } catch {}
}

/**
 * Checks if a token has been revoked / logged out.
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  const hash = hashToken(token);
  if (revokedTokenHashes.has(hash)) {
    return true;
  }

  try {
    const { isMongoConnected } = await import('../db/connection.js');
    if (isMongoConnected) {
      const { RevokedTokenModel } = await import('../models/revoked-token.model.js');
      const found = await RevokedTokenModel.findOne({ tokenHash: hash }).lean();
      if (found) {
        revokedTokenHashes.add(hash);
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Signs a payload into an RFC 7519 compliant HS256 JWT
 * @param payload User data to sign
 * @param expiresInSeconds Expiration duration in seconds (default: 30 days)
 */
export function signJwt(
  payload: Omit<JwtUserPayload, 'iat' | 'exp'>,
  expiresInSeconds: number = 30 * 24 * 60 * 60
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtUserPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const secret = getJwtSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes an RFC 7519 HS256 JWT
 * @param token Encoded JWT string
 */
export function verifyJwt(token: string): JwtUserPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT token: must contain 3 parts');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // 1. Check in-memory revocation
  const hash = hashToken(token);
  if (revokedTokenHashes.has(hash)) {
    throw new Error('Token has been revoked. Session is invalid.');
  }

  // 2. Verify Header
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader));
  } catch {
    throw new Error('Invalid JWT header format');
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Unsupported JWT algorithm or type');
  }

  // 3. Verify Signature using constant-time comparison
  const secret = getJwtSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid JWT signature');
  }

  // 4. Decode & Verify Payload
  let payload: JwtUserPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new Error('Invalid JWT payload format');
  }

  // 5. Check Expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) {
    throw new Error('JWT token has expired');
  }

  if (!payload.userId) {
    throw new Error('Invalid JWT payload: userId is missing');
  }

  return payload;
}

/**
 * Decodes a JWT payload without verifying signature (for inspection)
 */
export function decodeJwt<T = JwtUserPayload>(token: string): T | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as T;
  } catch {
    return null;
  }
}
