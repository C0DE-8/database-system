export function MetricsGrid({ metrics }) {
  return (
    <section className="metrics">
      <article>
        <span>{metrics.projects}</span>
        <small>Projects</small>
      </article>
      <article>
        <span>{metrics.online}</span>
        <small>Online</small>
      </article>
      <article>
        <span>{metrics.activeQueries}</span>
        <small>Active Queries</small>
      </article>
      <article>
        <span>{metrics.totalQueries}</span>
        <small>Total Queries</small>
      </article>
    </section>
  )
}

