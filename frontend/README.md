# DBMS Gateway Frontend

React + Vite dashboard for the DBMS Gateway backend.

## Setup

```bash
npm install
npm run dev
```

By default the frontend calls:

```bash
http://localhost:4000
```

To use a different backend URL, create `.env` in `frontend/`:

```bash
VITE_API_URL=http://localhost:4000
```

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
