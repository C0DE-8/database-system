
ALTER TABLE project_api_keys
  ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT DEFAULT NULL AFTER key_hash;
