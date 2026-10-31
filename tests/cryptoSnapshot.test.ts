import { describe, it, expect } from "vitest";
import { encryptStatePayload, decryptStatePayload } from "../src/server/crypto.js";

describe("Cryptographic Envelope & Snapshot Integrity (AES-256-GCM + SHA-256)", () => {
  it("successfully encrypts and decrypts a state payload with matching SHA-256 digest", () => {
    const rawState = {
      step: 42100,
      prngSeed: 987654321,
      weights: [0.12, -0.45, 0.88, 1.23],
      loss: 0.142
    };

    const envelope = encryptStatePayload(rawState);
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(envelope.authTag).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(envelope.sha256Digest).toHaveLength(64); // 32 bytes = 64 hex chars

    const decrypted = decryptStatePayload(envelope);
    expect(decrypted.step).toBe(42100);
    expect(decrypted.loss).toBe(0.142);
    expect(decrypted.weights).toEqual([0.12, -0.45, 0.88, 1.23]);
  });

  it("throws an error when ciphertext is tampered with (GCM authentication check)", () => {
    const rawState = { step: 100, data: "secret" };
    const envelope = encryptStatePayload(rawState);

    // Tamper with ciphertext by flipping bits
    const tamperedCiphertext = "AAAA" + envelope.ciphertext.substring(4);
    const tamperedEnvelope = { ...envelope, ciphertext: tamperedCiphertext };

    expect(() => decryptStatePayload(tamperedEnvelope)).toThrow();
  });

  it("throws an error when SHA-256 digest is mismatched", () => {
    const rawState = { step: 200, data: "financial_record" };
    const envelope = encryptStatePayload(rawState);

    // Alter the digest
    const forgedDigest = "deadbeef" + envelope.sha256Digest.substring(8);
    const tamperedEnvelope = { ...envelope, sha256Digest: forgedDigest };

    expect(() => decryptStatePayload(tamperedEnvelope)).toThrow(/Cryptographic Integrity Violation/);
  });
});

