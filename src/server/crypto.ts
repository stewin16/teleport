import crypto from "crypto";

const MASTER_SECRET = process.env.TELEPORT_SECRET || "teleport-bnb-2026-distributed-secret-key-32b";
// Derive a 32-byte key for AES-256
const CIPHER_KEY = crypto.createHash("sha256").update(MASTER_SECRET).digest();

export interface EncryptedEnvelope {
  ciphertext: string; // Base64
  iv: string; // Hex
  authTag: string; // Hex
  sha256Digest: string; // Hex of original plaintext
}

/**
 * Encrypts a state object using AES-256-GCM with a fresh 12-byte IV
 * and generates a SHA-256 checksum for pre-flight integrity verification.
 */
export function encryptStatePayload(payload: any): EncryptedEnvelope {
  const jsonString = JSON.stringify(payload);
  const sha256Digest = crypto.createHash("sha256").update(jsonString, "utf8").digest("hex");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", CIPHER_KEY, iv);

  let encrypted = cipher.update(jsonString, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    authTag,
    sha256Digest
  };
}

/**
 * Decrypts an AES-256-GCM payload and asserts that the SHA-256 digest matches.
 * Throws an error immediately if the payload has been tampered with or corrupted.
 */
export function decryptStatePayload(envelope: EncryptedEnvelope): any {
  const { ciphertext, iv, authTag, sha256Digest } = envelope;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    CIPHER_KEY,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  // Verify SHA-256 integrity
  const computedDigest = crypto.createHash("sha256").update(decrypted, "utf8").digest("hex");
  if (computedDigest !== sha256Digest) {
    throw new Error(
      `Cryptographic Integrity Violation: Expected SHA-256 ${sha256Digest}, but computed ${computedDigest}`
    );
  }

  return JSON.parse(decrypted);
}

/**
 * Generates an HMAC token for authenticating a device handshake.
 */
export function generateDeviceToken(deviceId: string): string {
  return crypto.createHmac("sha256", CIPHER_KEY).update(deviceId).digest("hex");
}

/**
 * Verifies that a device token is authentic.
 */
export function verifyDeviceToken(deviceId: string, token: string): boolean {
  if (typeof token !== "string" || token.length !== 64) {
    return false;
  }
  try {
    const expected = generateDeviceToken(deviceId);
    const tokenBuf = Buffer.from(token, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (tokenBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}
