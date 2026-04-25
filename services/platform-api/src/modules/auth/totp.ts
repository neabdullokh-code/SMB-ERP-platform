import { createHmac, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function normalizeSecret(secret: string) {
  return secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
}

function decodeBase32(secret: string) {
  const normalized = normalizeSecret(secret);
  let bits = "";

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error(`Invalid TOTP secret character: ${character}`);
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits = 6) {
  const key = decodeBase32(secret);
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  message.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);

  return String(code % (10 ** digits)).padStart(digits, "0");
}

export function generateTotp(secret: string, timestamp = Date.now(), stepSeconds = 30, digits = 6) {
  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  return hotp(secret, counter, digits);
}

export function verifyTotp(secret: string, candidate: string, timestamp = Date.now(), window = 1, stepSeconds = 30, digits = 6) {
  const normalizedCandidate = candidate.trim();
  if (!/^\d+$/.test(normalizedCandidate)) {
    return false;
  }

  const target = Buffer.from(normalizedCandidate);
  const currentCounter = Math.floor(timestamp / 1000 / stepSeconds);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = Buffer.from(hotp(secret, currentCounter + offset, digits));
    if (expected.length === target.length && timingSafeEqual(expected, target)) {
      return true;
    }
  }

  return false;
}
