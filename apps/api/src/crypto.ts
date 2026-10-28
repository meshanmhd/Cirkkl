import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "crypto";

export function getOtpSecret(): string {
  const secret = process.env.OTP_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return "dev-test-only-otp-secret-at-least-32-chars-long";
  }
  return "";
}

export function deriveOtpKey(secret?: string): Buffer {
  const s = secret || getOtpSecret();
  const derived = hkdfSync("sha256", s, "", "cirkkl-otp-v1", 32);
  return Buffer.from(derived);
}

export function encryptOtp(otp: string, secret?: string): string {
  const key = deriveOtpKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(otp, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptOtp(stored: string, secret?: string): string {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted OTP format");
  }
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  const key = deriveOtpKey(secret);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function verifyLegacyHmac(inputOtp: string, storedHash: string, secret?: string): boolean {
  const s = secret || getOtpSecret();
  const computed = createHmac("sha256", s).update(inputOtp).digest("hex");
  if (computed.length !== storedHash.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}
