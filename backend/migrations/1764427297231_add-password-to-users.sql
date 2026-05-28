-- Up Migration
ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL;
 
-- Down Migration
ALTER TABLE users DROP COLUMN password;