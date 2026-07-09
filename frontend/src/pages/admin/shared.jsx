import styles from '../dashboard/Dashboard.module.css'

export function Metrics({ summary }) {
  return (
    <section className={styles.metrics}>
      <Metric label="Projects" value={summary.projects} />
      <Metric label="Online" value={summary.online} />
      <Metric label="Offline" value={summary.offline} />
      <Metric label="Active Queries" value={summary.activeQueries} />
      <Metric label="Total Queries" value={summary.totalQueries} />
    </section>
  )
}

export function Metric({ label, value }) {
  return (
    <article className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

export function StatusBadge({ status }) {
  return <span className={`${styles.status} ${styles[status] || ''}`}>{status}</span>
}

export function EmptyState({ title, copy }) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  )
}

export function Info({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
