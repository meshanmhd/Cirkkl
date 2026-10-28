ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_url text;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college text;
UPDATE profiles SET college = college_name WHERE college IS NULL;
UPDATE profiles SET college_name = college WHERE college_name IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch text;
UPDATE profiles SET branch = department WHERE branch IS NULL;
UPDATE profiles SET department = branch WHERE department IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS academic_year text;
UPDATE profiles SET academic_year = COALESCE(semester, admission_year::text) WHERE academic_year IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;
UPDATE profiles SET phone_number = phone WHERE phone_number IS NULL;
UPDATE profiles SET phone = phone_number WHERE phone IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
UPDATE profiles SET linkedin_url = linkedin WHERE linkedin_url IS NULL;
UPDATE profiles SET linkedin = linkedin_url WHERE linkedin IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url text;
UPDATE profiles SET github_url = github WHERE github_url IS NULL;
UPDATE profiles SET github = github_url WHERE github IS NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ckl_id text;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ticket_id text;
UPDATE registrations SET ticket_id = ticket_tier_id WHERE ticket_id IS NULL;
UPDATE registrations SET ticket_tier_id = ticket_id WHERE ticket_tier_id IS NULL;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS is_team boolean DEFAULT false;
UPDATE registrations SET is_team = (team_id IS NOT NULL) WHERE is_team IS NULL;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS field_values jsonb;
UPDATE registrations SET field_values = custom_field_values WHERE field_values IS NULL;
UPDATE registrations SET custom_field_values = field_values WHERE custom_field_values IS NULL;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE organisations ADD COLUMN IF NOT EXISTS owner_id uuid;
UPDATE organisations SET owner_id = id WHERE owner_id IS NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS ckl_id text;

