ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
UPDATE events SET start_date = (date || ' ' || COALESCE(time, '00:00'))::timestamp WHERE start_date IS NULL AND date IS NOT NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
UPDATE events SET is_featured = COALESCE(featured, false) WHERE is_featured IS NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url text;
UPDATE events SET banner_url = image WHERE banner_url IS NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS poster_url text;
UPDATE events SET poster_url = poster_image WHERE poster_url IS NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;
UPDATE events SET is_paid = (price = 'paid') WHERE is_paid IS NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS min_team_size integer DEFAULT 1;
UPDATE events SET min_team_size = COALESCE(team_min_size, 1);

ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_size integer DEFAULT 1;
UPDATE events SET max_team_size = COALESCE(team_max_size, 1);

ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text;
UPDATE events SET slug = id WHERE slug IS NULL;

ALTER TABLE organisations ADD COLUMN IF NOT EXISTS name text;
UPDATE organisations SET name = org_name WHERE name IS NULL;

ALTER TABLE organisations ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE members ADD COLUMN IF NOT EXISTS name text;
UPDATE members SET name = full_name WHERE name IS NULL;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
UPDATE notifications SET is_read = COALESCE(read, false) WHERE is_read IS NULL;
