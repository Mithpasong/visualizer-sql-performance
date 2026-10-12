-- (Recommended) Read-only account for the web app
-- Change the password, run this in the Supabase SQL Editor,
-- then point DATABASE_URL in .env.local at this account.
--   e.g. postgresql://sql_lab_reader.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

CREATE ROLE sql_lab_reader WITH LOGIN PASSWORD 'change-me-to-a-strong-password';

GRANT USAGE ON SCHEMA public TO sql_lab_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sql_lab_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sql_lab_reader;

ALTER ROLE sql_lab_reader SET default_transaction_read_only = on;
ALTER ROLE sql_lab_reader SET statement_timeout = '15s';
