-- goals-app: database login + schema
-- Run ONCE in the Supabase SQL editor (shared project, runs as `postgres`).
--
-- BEFORE RUNNING: replace CHANGE_ME below with a strong password, e.g. the
-- output of `openssl rand -hex 32` (hex avoids characters like ; = + / that
-- need escaping in connection strings). Do NOT save the real password into
-- this file; it is committed to git. Store it in your password manager, then
-- in the droplet's .env and the GOALS_DB_CONNECTION GitHub secret.

-- 1. The app's own login. No superuser, no role creation, no database creation.
CREATE ROLE goals_app WITH LOGIN PASSWORD 'CHANGE_ME'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- 2. Let `postgres` act as goals_app. Postgres 16+ requires this before a
--    schema can be handed to another role, and it lets you test with SET ROLE.
GRANT goals_app TO postgres;

-- 3. The goals schema, owned by goals_app: it can create, change and drop
--    anything inside it (EF Core migrations need that), and nothing else.
CREATE SCHEMA goals AUTHORIZATION goals_app;

-- 4. When goals_app connects, unqualified names resolve to its own schema.
ALTER ROLE goals_app SET search_path = goals;

-- ---------------------------------------------------------------------------
-- Verification (task 4.1): run separately after the statements above.
-- Expected: both statements succeed, then the table is gone again.
--
--   SET ROLE goals_app;
--   CREATE TABLE goals.smoke_test (id int);
--   DROP TABLE goals.smoke_test;
--   RESET ROLE;
-- ---------------------------------------------------------------------------
