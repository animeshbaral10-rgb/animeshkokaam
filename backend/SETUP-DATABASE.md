# PostgreSQL setup for Pet Tracking backend

Yes — you need a running PostgreSQL database and to create the schema before the app will work.

## 1. Install PostgreSQL

- **Windows:** [Download PostgreSQL](https://www.postgresql.org/download/windows/) and run the installer. Remember the password you set for the `postgres` user.
- **macOS:** `brew install postgresql@16` then `brew services start postgresql@16`
- **Linux:** e.g. `sudo apt install postgresql postgresql-client` (Ubuntu/Debian)

Make sure the PostgreSQL service is running.

## 2. Create the database

Using **psql** (or pgAdmin / any SQL client), connect as a superuser and create the database and (optionally) a user:

```bash
# Connect (default user is often 'postgres')
psql -U postgres

# In psql:
CREATE DATABASE pet_tracking_db;
# Optional: create a dedicated user
# CREATE USER pettrack WITH PASSWORD 'your_password';
# GRANT ALL PRIVILEGES ON DATABASE pet_tracking_db TO pettrack;
\q
```

## 3. Configure the backend

Copy the example env file and set your DB credentials:

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` and set at least:

- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_USERNAME` (default: postgres)
- `DB_PASSWORD` (your postgres user password)
- `DB_DATABASE=pet_tracking_db`

## 4. Run the migrations

Run the SQL migrations **in order** against `pet_tracking_db` (using psql, pgAdmin, or any PostgreSQL client).

**First** — create schema and tables:

```bash
psql -U postgres -d pet_tracking_db -f migrations/001_create_tables_local.sql
```

**Second** — add admin/lockout columns to `auth.users`:

```bash
psql -U postgres -d pet_tracking_db -f src/admin/add-admin-columns.sql
```

If your PostgreSQL is older than 14, the triggers in `001_create_tables_local.sql` use `EXECUTE FUNCTION`. If you get a syntax error, change those to `EXECUTE PROCEDURE` in that file.

## 5. (Optional) Create an admin user

From the `backend` folder:

```bash
npm run build
node dist/admin/create-admin.js
```

Or with ts-node:

```bash
npx ts-node src/admin/create-admin.ts
```

Use the same `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` if you want to override the defaults.

## 6. Start the app

From the project root:

```powershell
.\start-all.ps1
```

Or start backend and frontend separately: in `backend` run `npm run start:dev`, and in the project root run `npm run dev`.

---

**Summary:** Install PostgreSQL → create `pet_tracking_db` → set `DB_*` in `backend/.env` → run the two SQL migration files → (optional) create admin user → start the app.
