import { useCallback, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../../api/client'
import { getLogs, getStatus, getSummary, pingAllProjects } from '../../api/monitor'
import {
  createProject,
  deleteProject,
  deleteProjectApiKey,
  generateProjectApiKey,
  getProject,
  listProjects,
  pingProject,
  updateProject,
} from '../../api/projects'
import { clearToken } from '../../token'
import styles from './Dashboard.module.css'

const emptyForm = {
  name: '',
  siteId: '',
  host: 'localhost',
  port: '3306',
  database: '',
  user: 'root',
  password: '',
  connectionLimit: '10',
  queueLimit: '0',
  enabled: true,
}

export function Dashboard({ onLogout }) {
  const [summary, setSummary] = useState({
    projects: 0,
    online: 0,
    offline: 0,
    activeQueries: 0,
    totalQueries: 0,
  })
  const [projects, setProjects] = useState([])
  const [statusRows, setStatusRows] = useState([])
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const mergedProjects = useMemo(() => {
    return projects.map((project) => {
      const status = statusRows.find((row) => row.siteId === project.siteId)
      return {
        ...project,
        connection: status?.connection || project.connection || {},
      }
    })
  }, [projects, statusRows])

  const refresh = useCallback(async () => {
    try {
      const [nextSummary, nextProjects, nextStatus, nextLogs] = await Promise.all([
        getSummary(),
        listProjects(),
        getStatus(),
        getLogs(),
      ])
      setSummary(nextSummary)
      setProjects(nextProjects)
      setStatusRows(nextStatus)
      setLogs(nextLogs)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.message.toLowerCase().includes('token')) {
        clearToken()
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    queueMicrotask(() => {
      refresh()
    })

    const socket = io(API_ORIGIN)
    socket.on('status', setStatusRows)
    socket.on('activity', () => {
      getLogs().then(setLogs).catch((requestError) => setError(requestError.message))
    })

    return () => socket.disconnect()
  }, [refresh])

  function logout() {
    clearToken()
    onLogout()
  }

  async function handleCreateProject(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const payload = {
        name: form.name,
        siteId: form.siteId,
        enabled: form.enabled,
        credentials: {
          host: form.host,
          port: Number(form.port || 3306),
          database: form.database,
          user: form.user,
          password: form.password,
          connectionLimit: Number(form.connectionLimit || 10),
          queueLimit: Number(form.queueLimit || 0),
        },
      }

      const result = form.editingSiteId
        ? await updateProject(form.editingSiteId, payload)
        : await createProject(payload)

      setForm(emptyForm)
      setMessage(`Project saved.${result?.apiKey ? ` API key: ${result.apiKey}` : ''}`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function editProject(project) {
    setMessage('')
    setError('')

    try {
      const fullProject = await getProject(project.siteId)
      const credentials = fullProject.credentials || {}
      setForm({
        editingSiteId: fullProject.siteId,
        name: fullProject.name || '',
        siteId: fullProject.siteId || '',
        host: credentials.host || 'localhost',
        port: String(credentials.port || 3306),
        database: credentials.database || '',
        user: credentials.user || 'root',
        password: credentials.password || '',
        connectionLimit: String(credentials.connectionLimit || 10),
        queueLimit: String(credentials.queueLimit || 0),
        enabled: fullProject.enabled,
      })
      setMessage(`Editing ${fullProject.siteId}.`)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function clearForm() {
    setForm(emptyForm)
    setMessage('')
    setError('')
  }

  async function runProjectAction(action, project) {
    setMessage('')
    setError('')

    try {
      if (action === 'ping') {
        const result = await pingProject(project.siteId)
        setMessage(`${project.siteId} is ${result.online ? 'online' : 'offline'}.`)
      }

      if (action === 'key') {
        const result = await generateProjectApiKey(project.siteId, { name: 'Dashboard key' })
        setMessage(`New API key for ${project.siteId}: ${result.apiKey}`)
      }

      if (action === 'delete') {
        const confirmed = window.confirm(`Delete ${project.siteId}? This removes the project and its keys.`)
        if (!confirmed) return
        await deleteProject(project.siteId)
        setMessage(`Deleted ${project.siteId}.`)
      }

      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function pingAll() {
    try {
      await pingAllProjects()
      setMessage('Pinged all projects.')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function copyText(value, label) {
    if (!value) {
      setMessage(`${label} is not available.`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label} copied.`)
    } catch {
      setMessage(`${label}: ${value}`)
    }
  }

  async function removeApiKey(project, key) {
    setMessage('')
    setError('')

    try {
      await deleteProjectApiKey(project.siteId, key.id)
      setMessage(`Deleted API key ${key.prefix} from ${project.siteId}.`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>DBMS Gateway</p>
          <h1>Connection Management</h1>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondary} onClick={refresh}>
            Refresh
          </button>
          <button type="button" className={styles.secondary} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className={styles.metrics}>
        <Metric label="Projects" value={summary.projects} />
        <Metric label="Online" value={summary.online} />
        <Metric label="Offline" value={summary.offline} />
        <Metric label="Active Queries" value={summary.activeQueries} />
        <Metric label="Total Queries" value={summary.totalQueries} />
      </section>

      {(message || error) && (
        <div className={error ? styles.alertError : styles.alert}>{error || message}</div>
      )}

      <section className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Projects</h2>
            <button type="button" className={styles.secondary} onClick={pingAll}>
              Ping all
            </button>
          </div>

          {loading && <p className={styles.muted}>Loading projects...</p>}
          {!loading && !mergedProjects.length && <p className={styles.muted}>No projects yet.</p>}

          <div className={styles.projectList}>
            {mergedProjects.map((project) => (
              <article className={styles.project} key={project.siteId}>
                <div className={styles.projectTop}>
                  <div>
                    <strong>{project.name}</strong>
                    <span>
                      {project.siteId} · {project.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <StatusBadge status={project.connection?.status || 'unknown'} />
                </div>

                <dl className={styles.infoGrid}>
                  <div>
                    <dt>Database</dt>
                    <dd>{project.credentials?.database || 'not set'}</dd>
                  </div>
                  <div>
                    <dt>Host</dt>
                    <dd>{project.credentials?.host || 'localhost'}:{project.credentials?.port || 3306}</dd>
                  </div>
                  <div>
                    <dt>User</dt>
                    <dd>{project.credentials?.user || 'root'}</dd>
                  </div>
                  <div>
                    <dt>Pool</dt>
                    <dd>
                      {project.credentials?.connectionLimit || 10} connections · queue{' '}
                      {project.credentials?.queueLimit || 0}
                    </dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(project.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(project.updatedAt)}</dd>
                  </div>
                </dl>

                <dl className={styles.infoGrid}>
                  <div>
                    <dt>Total queries</dt>
                    <dd>{project.connection?.totalQueries || 0}</dd>
                  </div>
                  <div>
                    <dt>Active</dt>
                    <dd>{project.connection?.activeQueries || 0}</dd>
                  </div>
                  <div>
                    <dt>Failed</dt>
                    <dd>{project.connection?.failedQueries || 0}</dd>
                  </div>
                  <div>
                    <dt>Last error</dt>
                    <dd>{project.connection?.lastError || 'None'}</dd>
                  </div>
                </dl>

                <div className={styles.keyList}>
                  <div className={styles.sectionTitle}>API Keys</div>
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
                        <button type="button" className={styles.secondary} onClick={() => copyText(key.apiKey || key.prefix, 'API key')}>
                          Copy
                        </button>
                        <button type="button" className={styles.danger} onClick={() => removeApiKey(project, key)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {project.connection?.lastError && (
                  <p className={styles.errorText}>{project.connection.lastError}</p>
                )}
                <div className={styles.actions}>
                  <button type="button" className={styles.secondary} onClick={() => editProject(project)}>
                    Edit
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => copyText(project.siteId, 'Site ID')}>
                    Copy ID
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => runProjectAction('ping', project)}>
                    Ping
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => runProjectAction('key', project)}>
                    Generate key
                  </button>
                  <button type="button" className={styles.danger} onClick={() => runProjectAction('delete', project)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{form.editingSiteId ? `Edit ${form.editingSiteId}` : 'Add Project'}</h2>
            {form.editingSiteId && (
              <button type="button" className={styles.secondary} onClick={clearForm}>
                Cancel
              </button>
            )}
          </div>
          <form className={styles.form} onSubmit={handleCreateProject}>
            <label>
              Project name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Site ID
              <input value={form.siteId} onChange={(event) => setForm({ ...form, siteId: event.target.value })} disabled={Boolean(form.editingSiteId)} required />
            </label>
            <label>
              Host
              <input value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} />
            </label>
            <label>
              Port
              <input type="number" value={form.port} onChange={(event) => setForm({ ...form, port: event.target.value })} />
            </label>
            <label>
              Database
              <input value={form.database} onChange={(event) => setForm({ ...form, database: event.target.value })} required />
            </label>
            <label>
              User
              <input value={form.user} onChange={(event) => setForm({ ...form, user: event.target.value })} />
            </label>
            <label>
              Password
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <label>
              Pool size
              <input type="number" value={form.connectionLimit} onChange={(event) => setForm({ ...form, connectionLimit: event.target.value })} />
            </label>
            <label>
              Queue limit
              <input type="number" value={form.queueLimit} onChange={(event) => setForm({ ...form, queueLimit: event.target.value })} />
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
              Enabled
            </label>
            <button type="submit">{form.editingSiteId ? 'Update project' : 'Save project'}</button>
          </form>
        </section>
      </section>

      <section className={styles.panel}>
        <h2>Activity Logs</h2>
        <div className={styles.logs}>
          {!logs.length && <p className={styles.muted}>No logs yet.</p>}
          {logs.map((log) => (
            <article className={styles.log} key={log.id}>
              <strong>{log.type}</strong>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              <p>{log.message}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }) {
  return (
    <article className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function StatusBadge({ status }) {
  return <span className={`${styles.status} ${styles[status] || ''}`}>{status}</span>
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString()
}
