# DBMS Gateway Frontend

React + Vite dashboard for the DBMS Gateway backend.

## Setup

```bash
npm install
npm run dev
```

By default the frontend calls:

```bash
https://api.dbms.copupbid.com/api
```

To use a different backend URL, create `.env` in `frontend/`:

```bash
VITE_API_URL=https://api.dbms.copupbid.com/api
```

`VITE_API_URL` should include `/api`. Socket.IO uses the same host without the `/api` suffix.

## Frontend API Files

Axios is configured in:

```bash
src/api/client.js
```

Each backend route group has its own frontend API file:

- `src/api/auth.routes.js`
- `src/api/projects.routes.js`
- `src/api/monitor.routes.js`
- `src/api/gateway.routes.js`
