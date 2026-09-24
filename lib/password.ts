import crypto from "crypto";
import bcrypt from "bcryptjs";

// bcrypt work factor. 12 is the current recommended minimum for new hashes
// (existing hashes made with 10 keep working — bcrypt stores the cost in the hash).
export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// Cryptographically secure temporary password (Math.random() is predictable).
// Skips look-alike characters (0/O, 1/l/I) so it's easy to read out to someone.
export function generateTempPassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

// Constant-time string comparison for secrets such as the setup token.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
