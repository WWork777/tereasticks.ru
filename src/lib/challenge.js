// Proof-of-Work challenge system
// Server issues a challenge, client must find a nonce that produces a hash starting with '0000'
import crypto from "crypto";

const challengeStore = new Map();
const CHALLENGE_TTL = 300_000; // 5 min
const DIFFICULTY = 4; // number of leading zeros required

// Cleanup old challenges every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of challengeStore) {
    if (now - entry.created > CHALLENGE_TTL) {
      challengeStore.delete(key);
    }
  }
}, CHALLENGE_TTL);

export function createChallenge() {
  const id = crypto.randomBytes(16).toString("hex");
  const salt = crypto.randomBytes(8).toString("hex");
  challengeStore.set(id, { salt, created: Date.now(), used: false });
  return { id, salt, difficulty: DIFFICULTY };
}

export function verifyChallenge(id, nonce) {
  const entry = challengeStore.get(id);
  if (!entry) return { valid: false, reason: "expired" };
  if (entry.used) return { valid: false, reason: "reused" };
  if (Date.now() - entry.created > CHALLENGE_TTL) {
    challengeStore.delete(id);
    return { valid: false, reason: "expired" };
  }

  const hash = crypto
    .createHash("sha256")
    .update(entry.salt + ":" + String(nonce))
    .digest("hex");

  const prefix = "0".repeat(DIFFICULTY);
  if (!hash.startsWith(prefix)) {
    return { valid: false, reason: "invalid" };
  }

  // Mark as used — one-time use
  entry.used = true;
  return { valid: true };
}
