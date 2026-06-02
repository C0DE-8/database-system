export function ConnectorExample() {
  return (
    <div className="panel">
      <h2>Connector Example</h2>
      <pre>
        <code>{`const { connectProject } = require("./connector");

const db = connectProject("shop", {
  apiKey: process.env.API_KEY,
  dbmsUrl: process.env.DBMS_URL
});

const rows = await db.query(
  "SELECT * FROM products WHERE id = ?",
  [productId]
);`}</code>
      </pre>
    </div>
  )
}

