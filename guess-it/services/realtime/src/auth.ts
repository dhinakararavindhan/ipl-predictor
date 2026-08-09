/**
 * Guest identity — server-issued player ids with signed tokens.
 * Token = base64url(playerId:issuedAt:hmac). No PII, no passwords; the token
 * simply proves "same device that created this player". AUTH_SECRET must be
 * set in production (a random default is generated per-boot otherwise, which
 * invalidates tokens on restart — fine for dev, logged loudly).
 */
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const SECRET =
  process.env.AUTH_SECRET ??
  (() => {
    const s = randomBytes(32).toString('hex');
    console.warn('AUTH_SECRET not set — using a per-boot secret (tokens reset on restart)');
    return s;
  })();

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function issuePlayer(): { playerId: string; token: string } {
  const playerId = randomUUID();
  const issued = Date.now();
  const payload = `${playerId}:${issued}`;
  const token = Buffer.from(`${payload}:${sign(payload)}`).toString('base64url');
  return { playerId, token };
}

/** Returns the playerId if the token is valid, else null. */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const idx = raw.lastIndexOf(':');
    const payload = raw.slice(0, idx);
    const mac = raw.slice(idx + 1);
    const expect = sign(payload);
    if (mac.length !== expect.length) return null;
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
    return payload.split(':')[0] ?? null;
  } catch {
    return null;
  }
}
