-- Add version column to applications table for optimistic locking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add a trigger to auto-increment version on updates
CREATE OR REPLACE FUNCTION increment_application_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_application_version
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION increment_application_version();
