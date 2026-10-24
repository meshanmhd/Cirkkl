import { createHmac, timingSafeEqual } from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "cirkkl-otp-secret-key-2026";

export function hashOtp(otp: string): string {
  return createHmac("sha256", OTP_SECRET).update(otp).digest("hex");
}

export function verifyOtpHash(inputOtp: string, storedHash: string): boolean {
  const computed = hashOtp(inputOtp);
  if (computed.length !== storedHash.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}
