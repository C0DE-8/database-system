# Shop Backend Test

Small sample project that consumes the DBMS Gateway.

It does not store MySQL credentials. It only uses:

- `SITE_ID`
- `API_KEY`
- `DBMS_URL`

It uses the installable `diamond-sql` client, not files from the backend app:

```js
const { connectProject } = require("diamond-sql");
```

That means this app can be hosted on a different server. `DBMS_URL` should point to the hosted DBMS Gateway API.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Create a `shop` project in the DBMS dashboard, copy the generated API key into `.env`, then test:

```bash
API_KEY=dbms_full_key_value_shown_once_when_generated
```

The project list shows prefixes such as `dbms_Kyi8UVr`; those are not valid API keys. If you did not copy the full key when it was generated, generate a new key and copy the full value immediately.

```bash
curl http://localhost:5050/health
curl http://localhost:5050/products
```

Expected shop database table:

```sql
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id)
);
```
