ALTER TABLE IF EXISTS organisations
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_failed_attempts INT NOT NULL DEFAULT 0;

REVOKE UPDATE (otp_expires_at, otp_failed_attempts) ON organisations FROM authenticated;
REVOKE UPDATE (otp_expires_at, otp_failed_attempts) ON organisations FROM anon;
REVOKE SELECT (otp_expires_at, otp_failed_attempts) ON organisations FROM authenticated;
REVOKE SELECT (otp_expires_at, otp_failed_attempts) ON organisations FROM anon;
