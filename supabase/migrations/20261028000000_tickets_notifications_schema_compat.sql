ALTER TABLE tickets ADD COLUMN IF NOT EXISTS total_quantity integer;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS available_quantity integer;
UPDATE tickets SET total_quantity = quantity WHERE total_quantity IS NULL;
UPDATE tickets SET available_quantity = quantity WHERE available_quantity IS NULL;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
UPDATE notifications SET is_read = read WHERE is_read = false AND read = true;
UPDATE notifications SET read = is_read WHERE read IS NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS event_id text;

ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer;
UPDATE events SET capacity = seats WHERE capacity IS NULL;

