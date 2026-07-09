import { useAdmin } from '../admin/adminContextCore'
import { formatDate } from '../admin/format'
import styles from '../dashboard/Dashboard.module.css'

export function Activity({ compact = false, logs: providedLogs, refresh: providedRefresh }) {
  const admin = useAdmin()
  const logs = providedLogs || admin.logs
  const refresh = providedRefresh || admin.refresh

  return (
    <section className={`${styles.panel} ${styles.logsPanel} ${compact ? styles.compactPanel : ''}`}>
      <div className={styles.logsHeader}>
        <div>
          <h2>Activity Logs</h2>
          <p className={styles.muted}>Latest gateway events and admin actions</p>
        </div>
        <div className={styles.logTools}>
          <span>{logs.length} shown</span>
          <button type="button" className={styles.secondary} onClick={refresh}>Reload</button>
        </div>
      </div>

      <div className={styles.logs} role="log" aria-label="Activity logs">
        {!logs.length && (
          <div className={styles.emptyLogs}>
            <strong>No logs yet</strong>
            <span>New gateway activity will appear here.</span>
          </div>
        )}
        {logs.map((log) => (
          <article className={styles.log} key={log.id}>
            <div className={styles.logMeta}>
              <strong>{log.type}</strong>
              <span>{formatDate(log.createdAt)}</span>
            </div>
            <p>{log.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
