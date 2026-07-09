import { API_BASE_URL, API_ORIGIN } from '../../api/client'
import { Activity } from '../activity/Activity'
import { useAdmin } from '../admin/adminContextCore'
import { EmptyState, Info, Metrics, StatusBadge } from '../admin/shared'
import styles from '../dashboard/Dashboard.module.css'

export function Overview() {
  const admin = useAdmin()
  const recentProjects = admin.mergedProjects.slice(0, 4)

  return (
    <>
      <Metrics summary={admin.summary} />
      <section className={styles.commandBar}>
        <div>
          <span>API</span>
          <strong>{API_BASE_URL}</strong>
        </div>
        <div>
          <span>Last sync</span>
          <strong>{admin.lastSyncedAt || 'Waiting...'}</strong>
        </div>
        <div>
          <span>Connected projects</span>
          <strong>{admin.summary.online} online / {admin.summary.offline} offline</strong>
        </div>
      </section>

      <section className={styles.overviewGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Project Health</h2>
              <p className={styles.muted}>Recent project connection state</p>
            </div>
          </div>
          <div className={styles.quickList}>
            {!recentProjects.length && <EmptyState title="No projects yet" copy="Create a project from Setup." />}
            {recentProjects.map((project) => (
              <div className={styles.quickRow} key={project.siteId}>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.siteId} · {project.credentials?.database || 'no database'}</span>
                </div>
                <StatusBadge status={project.connection?.status || 'unknown'} />
              </div>
            ))}
          </div>
        </section>

        <Activity compact logs={admin.logs.slice(0, 8)} refresh={admin.refresh} />
      </section>

      <section className={styles.panel}>
        <h2>System Snapshot</h2>
        <dl className={styles.infoGrid}>
          <Info label="Total projects" value={admin.mergedProjects.length} />
          <Info label="Total queries" value={admin.summary.totalQueries} />
          <Info label="Active queries" value={admin.summary.activeQueries} />
          <Info label="API origin" value={API_ORIGIN} />
        </dl>
      </section>
    </>
  )
}
