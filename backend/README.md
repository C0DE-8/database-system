# DBMS Gateway

Centralized Node.js gateway for managing reusable MySQL connection pools across multiple apps.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Backend API: `http://localhost:4000`

If `PORT` is set in your `.env`, use that port instead. The frontend dashboard lives in `../frontend`.

Default development login:

- Email: `admin@example.com`
- Password: `change-me-now`

Change `JWT_SECRET`, `ENCRYPTION_KEY`, and admin credentials before real use.

## Backend Metadata Database

The backend now has its own DB connection file:

```bash
src/config/db.js
```

Configure it with:

```bash
DBMS_DB_HOST=localhost
DBMS_DB_PORT=3306
DBMS_DB_NAME=dbms_gateway
DBMS_DB_USER=root
DBMS_DB_PASSWORD=
DBMS_DB_CONNECTION_LIMIT=10
```

Run `migrations/001_create_dbms_gateway.sql` against `DBMS_DB_NAME`.

You can test that connection with:

```bash
GET /health/db
```

The backend initializes this schema at startup and stores projects, encrypted credentials, API key hashes, admins, logs, connection events, and query activity in MySQL.

## Project Connector

Each consuming app only needs `SITE_ID`, `API_KEY`, and `DBMS_URL`.

Use the installable `diamond-sql` client; do not import files from the backend app.

```js
const { connectProject } = require("diamond-sql");

const db = connectProject(process.env.SITE_ID, {
  apiKey: process.env.API_KEY,
  dbmsUrl: process.env.DBMS_URL
});

const rows = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

## API Overview

- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:siteId`
- `DELETE /api/projects/:siteId`
- `POST /api/projects/:siteId/keys`
- `DELETE /api/projects/:siteId/keys/:keyId`
- `GET /api/monitor/status`
- `GET /api/monitor/logs`
- `POST /gateway/query`
- `GET /gateway/status`

Gateway requests require:

- `x-site-id`
- `x-api-key`

## Migrations

The DBMS metadata schema is in:

```bash
migrations/001_create_dbms_gateway.sql
```

It contains tables for admins, projects, API keys, connection events, query activity, and gateway logs.

## Notes

Credentials are encrypted at rest in the `projects.encrypted_credentials` column using AES-256-GCM. API keys are shown once when generated and stored only as SHA-256 hashes.

## Test Project

A simple consuming app is available in:

```bash
../test/shop-backend
```
