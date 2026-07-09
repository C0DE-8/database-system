import { useCallback, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../../api/client'
import { getLogs, getStatus, getSummary, pingAllProjects } from '../../api/monitor'
import {
  createProject,
  deleteProject,
  generateProjectApiKey,
  listProjects,
  pingProject,
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
      const result = await createProject({
        name: form.name,
        siteId: form.siteId,
        enabled: true,
        credentials: {
          host: form.host,
          port: Number(form.port || 3306),
          database: form.database,
          user: form.user,
          password: form.password,
          connectionLimit: Number(form.connectionLimit || 10),
        },
      })
      setForm(emptyForm)
      setMessage(`Project saved.${result.apiKey ? ` API key: ${result.apiKey}` : ''}`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
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
                    <span>{project.siteId}</span>
                  </div>
                  <StatusBadge status={project.connection?.status || 'unknown'} />
                </div>
                <p className={styles.muted}>
                  {project.credentials?.user || 'root'}@{project.credentials?.host || 'localhost'}:
                  {project.credentials?.port || 3306}/{project.credentials?.database || 'not set'}
                </p>
                <p className={styles.muted}>
                  Queries: {project.connection?.totalQueries || 0} total,{' '}
                  {project.connection?.activeQueries || 0} active
                </p>
                {project.connection?.lastError && (
                  <p className={styles.errorText}>{project.connection.lastError}</p>
                )}
                <div className={styles.actions}>
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
          <h2>Add Project</h2>
          <form className={styles.form} onSubmit={handleCreateProject}>
            <input placeholder="Project name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <input placeholder="Site ID" value={form.siteId} onChange={(event) => setForm({ ...form, siteId: event.target.value })} required />
            <input placeholder="Host" value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} />
            <input placeholder="Port" type="number" value={form.port} onChange={(event) => setForm({ ...form, port: event.target.value })} />
            <input placeholder="Database" value={form.database} onChange={(event) => setForm({ ...form, database: event.target.value })} required />
            <input placeholder="User" value={form.user} onChange={(event) => setForm({ ...form, user: event.target.value })} />
            <input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <input placeholder="Pool size" type="number" value={form.connectionLimit} onChange={(event) => setForm({ ...form, connectionLimit: event.target.value })} />
            <button type="submit">Save project</button>
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
