export function ProjectsPanel({
  projects,
  filteredProjects,
  visibleProjects,
  projectSearch,
  currentProjectPage,
  pageCount,
  onSearchChange,
  onPageChange,
  onRefresh,
  onEdit,
  onProjectAction,
  onCopy,
  onDeleteApiKey,
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Projects</h2>
        <button type="button" className="secondary" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <div className="list-controls">
        <input
          value={projectSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects, database, host, status"
        />
        <span>
          {filteredProjects.length} of {projects.length}
        </span>
      </div>
      <div className="project-list">
        {!visibleProjects.length && <p className="message">No projects found.</p>}
        {visibleProjects.map((project) => (
          <article className="project" key={project.siteId}>
            <div className="project-row">
              <div>
                <strong>{project.name}</strong>
                <div>
                  {project.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <span className={`status ${project.connection.status}`}>
                {project.connection.status}
              </span>
            </div>
            <div className="key-list">
              <strong>Site ID</strong>
              <div className="key-row">
                <code>{project.siteId}</code>
                <span>Project ID</span>
                <button
                  type="button"
                  className="secondary compact"
                  onClick={() => onCopy(project.siteId, 'Site ID')}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="key">
              <strong>Database</strong>
              <span>
                {project.credentials?.user || 'root'}@{project.credentials?.host || 'localhost'}:
                {project.credentials?.port || 3306}/{project.credentials?.database || 'not set'}
              </span>
            </div>
            <div className="key-list">
              <strong>API Keys</strong>
              {!project.apiKeys.length && <span className="muted">No keys</span>}
              {project.apiKeys.map((key) => (
                <div className="key-row" key={key.id}>
                  <code>{key.apiKey || key.prefix}</code>
                  <span>{key.revokedAt ? 'Revoked' : 'Active'}</span>
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => onCopy(key.apiKey, 'API key')}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="danger compact"
                    onClick={() => onDeleteApiKey(project, key)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="key">
              Queries: {project.connection.totalQueries} total ·{' '}
              {project.connection.activeQueries} active · {project.connection.failedQueries} failed
            </div>
            {project.connection.lastError && (
              <div className="key">Last error: {project.connection.lastError}</div>
            )}
            <div className="actions">
              <button type="button" className="secondary" onClick={() => onEdit(project)}>
                Edit
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => onProjectAction('ping', project)}
              >
                Ping
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => onProjectAction('key', project)}
              >
                Generate Key
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onProjectAction('delete', project)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="pagination">
        <button
          type="button"
          className="secondary compact"
          disabled={currentProjectPage === 1}
          onClick={() => onPageChange(Math.max(1, currentProjectPage - 1))}
        >
          Previous
        </button>
        <span>
          Page {currentProjectPage} of {pageCount}
        </span>
        <button
          type="button"
          className="secondary compact"
          disabled={currentProjectPage === pageCount}
          onClick={() => onPageChange(Math.min(pageCount, currentProjectPage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  )
}
