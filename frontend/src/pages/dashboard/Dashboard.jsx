import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  createProject,
  deleteProject,
  deleteProjectApiKey,
  generateProjectApiKey,
  getProject,
  listProjects,
  pingProject,
  updateProject,
} from '../../api/projects.routes'
import { getLogs, getStatus, pingAllProjects } from '../../api/monitor.routes'
import { API_ORIGIN } from '../../api/client'
import { ActivityLogs } from '../../components/ActivityLogs'
import { ConnectorExample } from '../../components/ConnectorExample'
import { DashboardHeader } from '../../components/DashboardHeader'
import { MetricsGrid } from '../../components/MetricsGrid'
import { ProjectFormPanel } from '../../components/ProjectFormPanel'
import { ProjectsPanel } from '../../components/ProjectsPanel'
import { mergeProjects } from '../../utils/projects'
import styles from './Dashboard.module.css'

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

export function Dashboard({ token, onLogout }) {
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
    setProjects([])
    setLogs([])
    onLogout()
  }, [onLogout])

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

  function updateProjectForm(changes) {
    setProjectForm((current) => ({ ...current, ...changes }))
  }

  return (
    <main className={styles.shell}>
      <DashboardHeader onLogout={logout} />
      <MetricsGrid metrics={metrics} />

      <section className="workspace">
        <ProjectsPanel
          projects={projects}
          filteredProjects={filteredProjects}
          visibleProjects={visibleProjects}
          projectSearch={projectSearch}
          currentProjectPage={currentProjectPage}
          pageCount={pageCount}
          onSearchChange={(value) => {
            setProjectSearch(value)
            setProjectPage(1)
          }}
          onPageChange={setProjectPage}
          onRefresh={refresh}
          onEdit={editProject}
          onProjectAction={handleProjectAction}
          onCopy={copyText}
          onDeleteApiKey={handleDeleteApiKey}
        />
        <ProjectFormPanel
          projectForm={projectForm}
          message={message}
          error={error}
          onSubmit={handleProjectSubmit}
          onClear={() => clearProjectForm()}
          onChange={updateProjectForm}
        />
      </section>

      <section className="workspace lower">
        <ActivityLogs logs={logs} />
        <ConnectorExample />
      </section>
    </main>
  )
}
