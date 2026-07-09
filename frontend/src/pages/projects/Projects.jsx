import { useNavigate } from 'react-router-dom'
import { formatDate } from '../admin/format'
import { EmptyState, Info, StatusBadge } from '../admin/shared'
import { useAdmin } from '../admin/adminContextCore'
import styles from '../dashboard/Dashboard.module.css'

export function Projects() {
  const admin = useAdmin()
  const navigate = useNavigate()

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2>Projects</h2>
          <p className={styles.muted}>Search, inspect, and manage every project connection.</p>
        </div>
        <div className={styles.panelActions}>
          <button type="button" className={styles.secondary} onClick={admin.pingAll}>
            Ping all
          </button>
        </div>
      </div>

      <div className={styles.projectControls}>
        <input
          value={admin.projectSearch}
          onChange={(event) => admin.setProjectSearch(event.target.value)}
          placeholder="Search by project, site ID, database, host, user, or status"
        />
        <div className={styles.filterChips} aria-label="Project status filter">
          {['all', 'online', 'offline', 'unknown'].map((status) => (
            <button
              type="button"
              className={admin.statusFilter === status ? styles.activeChip : styles.chip}
              onClick={() => admin.setStatusFilter(status)}
              key={status}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {admin.loading && <p className={styles.muted}>Loading projects...</p>}
      {!admin.loading && !admin.filteredProjects.length && (
        <EmptyState title="No matching projects" copy="Adjust the search or status filter, or add a new project." />
      )}

      <div className={styles.projectList}>
        {admin.filteredProjects.map((project) => (
          <ProjectCard admin={admin} key={project.siteId} navigate={navigate} project={project} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ admin, navigate, project }) {
  return (
    <article className={styles.project}>
      <div className={styles.projectTop}>
        <div>
          <strong>{project.name}</strong>
          <span>{project.siteId} · {project.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <StatusBadge status={project.connection?.status || 'unknown'} />
      </div>

      <div className={styles.projectPills}>
        <span>{project.credentials?.database || 'No database'}</span>
        <span>{project.credentials?.host || 'localhost'}:{project.credentials?.port || 3306}</span>
        <span>{project.credentials?.user || 'root'}</span>
      </div>

      <dl className={styles.statsGrid}>
        <Info label="Total" value={project.connection?.totalQueries || 0} />
        <Info label="Active" value={project.connection?.activeQueries || 0} />
        <Info label="Failed" value={project.connection?.failedQueries || 0} />
      </dl>

      <details className={styles.details}>
        <summary>Connection details</summary>
        <dl className={styles.infoGrid}>
          <Info label="Database" value={project.credentials?.database || 'not set'} />
          <Info label="Host" value={`${project.credentials?.host || 'localhost'}:${project.credentials?.port || 3306}`} />
          <Info label="User" value={project.credentials?.user || 'root'} />
          <Info label="Pool" value={`${project.credentials?.connectionLimit || 10} connections · queue ${project.credentials?.queueLimit || 0}`} />
          <Info label="Created" value={formatDate(project.createdAt)} />
          <Info label="Updated" value={formatDate(project.updatedAt)} />
        </dl>
      </details>

      <details className={styles.details}>
        <summary>API Keys ({project.apiKeys?.length || 0})</summary>
        <div className={styles.keyList}>
          {!project.apiKeys?.length && <p className={styles.muted}>No API keys.</p>}
          {project.apiKeys?.map((key) => (
            <div className={styles.keyRow} key={key.id}>
              <div>
                <strong>{key.name || 'API key'}</strong>
                <span>
                  {key.prefix} · {key.revokedAt ? 'Revoked' : 'Active'} · created{' '}
                  {formatDate(key.createdAt)}
                </span>
              </div>
              <div className={styles.keyActions}>
                <button type="button" className={styles.secondary} onClick={() => admin.copyText(key.apiKey || key.prefix, 'API key')}>
                  Copy
                </button>
                <button type="button" className={styles.danger} onClick={() => admin.removeApiKey(project, key)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </details>

      {project.connection?.lastError && <p className={styles.errorText}>{project.connection.lastError}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => admin.editProject(project)}>Edit</button>
        <button type="button" className={styles.secondary} onClick={() => admin.copyText(project.siteId, 'Site ID')}>Copy ID</button>
        <button type="button" className={styles.secondary} onClick={() => navigate(`/browser/${encodeURIComponent(project.siteId)}`)}>Browse DBs</button>
        <button type="button" className={styles.secondary} onClick={() => admin.runProjectAction('ping', project)}>Ping</button>
        <button type="button" className={styles.secondary} onClick={() => admin.runProjectAction('key', project)}>Generate key</button>
        <button type="button" className={styles.danger} onClick={() => admin.runProjectAction('delete', project)}>Delete</button>
      </div>
    </article>
  )
}
