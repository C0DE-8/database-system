export function ActivityLogs({ logs }) {
  return (
    <div className="panel">
      <h2>Activity Logs</h2>
      <div className="logs">
        {logs.map((log) => (
          <div className="log" key={log.id}>
            <strong>
              {log.type} · {new Date(log.createdAt).toLocaleString()}
            </strong>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  )
}

