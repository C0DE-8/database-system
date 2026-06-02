import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  createProject,
  deleteProjectApiKey,
  deleteProject,
  generateProjectApiKey,
  getProject,
  listProjects,
  pingProject,
  updateProject,
} from './api/projects.routes'
import { login } from './api/auth.routes'
import { getLogs, getStatus, pingAllProjects } from './api/monitor.routes'
import { API_ORIGIN } from './api/client'
import './App.css'

const emptyProject = {
  editingSiteId: '',
  name: '',
  siteId: '',
  host: 'localhost',
  port: '3306',
  database: '',
  user: 'root',
  password: '',
  connectionLimit: '10',
  enabled: true,
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('dbmsToken') || '')
  const [loginForm, setLoginForm] = useState({
    email: 'admin@example.com',
    password: 'change-me-now',
  })
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [projects, setProjects] = useState([])
  const projectDetailsRef = useRef([])
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [projectPage, setProjectPage] = useState(1)
  const pageSize = 5

  const metrics = useMemo(
    () => ({
      projects: projects.length,
      online: projects.filter((project) => project.connection.status === 'online').length,
      activeQueries: projects.reduce((sum, project) => sum + project.connection.activeQueries, 0),
      totalQueries: projects.reduce((sum, project) => sum + project.connection.totalQueries, 0),
    }),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase()
    if (!query) return projects

    return projects.filter((project) => {
      const credentials = project.credentials || {}
      return [
        project.name,
        project.siteId,
        credentials.database,
        credentials.host,
        credentials.user,
        project.connection?.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [projectSearch, projects])

  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize))
  const currentProjectPage = Math.min(projectPage, pageCount)
  const visibleProjects = filteredProjects.slice(
    (currentProjectPage - 1) * pageSize,
    currentProjectPage * pageSize,
  )

  const logout = useCallback(() => {
    localStorage.removeItem('dbmsToken')
    setToken('')
    setProjects([])
    setLogs([])
  }, [])

  const loadLogs = useCallback(async () => {
    if (!token) return
    setLogs(await getLogs())
  }, [token])

  const refresh = useCallback(async () => {
    if (!token) return

    try {
      const [statusRows, detailRows, logRows] = await Promise.all([
        getStatus(),
        listProjects(),
        getLogs(),
      ])
      projectDetailsRef.current = detailRows
      setProjects(mergeProjects(statusRows, detailRows))
      setLogs(logRows)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.message.toLowerCase().includes('token')) {
        logout()
      }
    }
  }, [logout, token])

  useEffect(() => {
    if (!token) return undefined

    queueMicrotask(() => {
      refresh()
    })
    const socket = io(API_ORIGIN)
    socket.on('status', (statusRows) => {
      setProjects(mergeProjects(statusRows, projectDetailsRef.current))
    })
    socket.on('activity', loadLogs)
    const pingTimer = setInterval(async () => {
      try {
        await pingAllProjects()
        await refresh()
      } catch (requestError) {
        setError(requestError.message)
      }
    }, 30000)

    return () => {
      socket.disconnect()
      clearInterval(pingTimer)
    }
  }, [loadLogs, refresh, token])

  async function handleLogin(event) {
    event.preventDefault()
    try {
      const result = await login(loginForm)
      localStorage.setItem('dbmsToken', result.token)
      setToken(result.token)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleProjectSubmit(event) {
    event.preventDefault()
    const payload = {
      name: projectForm.name,
      siteId: projectForm.siteId,
      enabled: projectForm.enabled,
      credentials: {
        host: projectForm.host || 'localhost',
        port: Number(projectForm.port || 3306),
        database: projectForm.database,
        user: projectForm.user || 'root',
        password: projectForm.password || '',
        connectionLimit: Number(projectForm.connectionLimit || 10),
      },
    }

    if (projectForm.editingSiteId && !projectForm.password) {
      delete payload.credentials
    }

    try {
      const result = projectForm.editingSiteId
        ? await updateProject(projectForm.editingSiteId, payload)
        : await createProject(payload)
      setMessage(`Saved.${result?.apiKey ? ` New API key: ${result.apiKey}` : ''}`)
      clearProjectForm(false)
      refresh()
    } catch (requestError) {
      setMessage(requestError.message)
    }
  }

  async function editProject(project) {
    const fullProject = await getProject(project.siteId)
    const credentials = fullProject.credentials || {}
    setProjectForm({
      ...emptyProject,
      editingSiteId: fullProject.siteId,
      name: fullProject.name,
      siteId: fullProject.siteId,
      host: credentials.host || 'localhost',
      port: String(credentials.port || 3306),
      database: credentials.database || '',
      user: credentials.user || 'root',
      password: credentials.password || '',
      connectionLimit: String(credentials.connectionLimit || 10),
      enabled: fullProject.enabled,
    })
    setMessage('Loaded saved project configuration.')
  }

  async function handleProjectAction(action, project) {
    if (action === 'ping') {
      await pingProject(project.siteId)
    }

    if (action === 'key') {
      const result = await generateProjectApiKey(project.siteId, { name: 'Dashboard key' })
      setMessage(`New API key for ${project.siteId}: ${result.apiKey}`)
    }

    if (action === 'delete') {
      await deleteProject(project.siteId)
      setMessage(`Deleted ${project.siteId}`)
    }

    refresh()
  }

  function clearProjectForm(clearMessage = true) {
    setProjectForm(emptyProject)
    if (clearMessage) setMessage('')
  }

  async function copyText(value, label) {
    if (!value) {
      setMessage(`${label} is not available. Generate a new API key to make it copyable.`)
      return
    }
    await navigator.clipboard.writeText(value)
    setMessage(`${label} copied.`)
  }

  async function handleDeleteApiKey(project, key) {
    await deleteProjectApiKey(project.siteId, key.id)
    setMessage(`Deleted API key ${key.prefix} for ${project.siteId}.`)
    refresh()
  }

  if (!token) {
    return (
      <main className="shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">DBMS Gateway</p>
            <h1>Admin Console</h1>
          </div>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </label>
            <button type="submit">Sign in</button>
            {error && <p className="error">{error}</p>}
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DBMS Gateway</p>
          <h1>Connection Management</h1>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </header>

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

      <section className="workspace">
        <div className="panel">
          <div className="panel-head">
            <h2>Projects</h2>
            <button type="button" className="secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
          <div className="list-controls">
            <input
              value={projectSearch}
              onChange={(event) => {
                setProjectSearch(event.target.value)
                setProjectPage(1)
              }}
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
                      {project.siteId} · {project.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <span className={`status ${project.connection.status}`}>
                    {project.connection.status}
                  </span>
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
                        onClick={() => copyText(key.apiKey, 'API key')}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="danger compact"
                        onClick={() => handleDeleteApiKey(project, key)}
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
                  <button type="button" className="secondary" onClick={() => editProject(project)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleProjectAction('ping', project)}
                  >
                    Ping
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleProjectAction('key', project)}
                  >
                    Generate Key
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleProjectAction('delete', project)}
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
              onClick={() => setProjectPage((page) => Math.max(1, page - 1))}
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
              onClick={() => setProjectPage((page) => Math.min(pageCount, page + 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Add / Edit Project</h2>
            <button type="button" className="secondary" onClick={() => clearProjectForm()}>
              Clear
            </button>
          </div>
          <form className="form grid-form" onSubmit={handleProjectSubmit}>
            <label>
              Name
              <input
                value={projectForm.name}
                onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                placeholder="Shop Website"
                required
              />
            </label>
            <label>
              Site ID
              <input
                value={projectForm.siteId}
                onChange={(event) => setProjectForm({ ...projectForm, siteId: event.target.value })}
                placeholder="shop"
                disabled={Boolean(projectForm.editingSiteId)}
                required
              />
            </label>
            <label>
              Host
              <input
                value={projectForm.host}
                onChange={(event) => setProjectForm({ ...projectForm, host: event.target.value })}
                placeholder="localhost"
              />
            </label>
            <label>
              Port
              <input
                type="number"
                value={projectForm.port}
                onChange={(event) => setProjectForm({ ...projectForm, port: event.target.value })}
              />
            </label>
            <label>
              Database
              <input
                value={projectForm.database}
                onChange={(event) => setProjectForm({ ...projectForm, database: event.target.value })}
                placeholder="shop_db"
                required={!projectForm.editingSiteId}
              />
            </label>
            <label>
              User
              <input
                value={projectForm.user}
                onChange={(event) => setProjectForm({ ...projectForm, user: event.target.value })}
                placeholder="root"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={projectForm.password}
                onChange={(event) => setProjectForm({ ...projectForm, password: event.target.value })}
                placeholder="Optional"
              />
            </label>
            <label>
              Pool Size
              <input
                type="number"
                value={projectForm.connectionLimit}
                onChange={(event) =>
                  setProjectForm({ ...projectForm, connectionLimit: event.target.value })
                }
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={projectForm.enabled}
                onChange={(event) =>
                  setProjectForm({ ...projectForm, enabled: event.target.checked })
                }
              />
              Enabled
            </label>
            <button type="submit">Save Project</button>
            {message && <p className="message">{message}</p>}
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </section>

      <section className="workspace lower">
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
      </section>
    </main>
  )
}

function mergeProjects(statusRows, detailRows) {
  const detailsBySiteId = new Map(detailRows.map((project) => [project.siteId, project]))

  return statusRows.map((statusProject) => ({
    ...statusProject,
    ...(detailsBySiteId.get(statusProject.siteId) || {}),
    connection: statusProject.connection,
    poolOpen: statusProject.poolOpen,
  }))
}

export default App
