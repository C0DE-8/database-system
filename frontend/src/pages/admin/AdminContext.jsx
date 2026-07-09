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
  listDatabases,
  listDatabaseTables,
  listProjects,
  listTableColumns,
  pingProject,
  updateProject,
} from '../../api/projects'
import { clearToken } from '../../token'
import { AdminContext } from './adminContextCore'
import { emptyForm } from './adminState'

export function AdminProvider({ children, onLogout }) {
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
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectSearch, setProjectSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [browser, setBrowser] = useState({
    siteId: '',
    database: '',
    table: '',
    databases: [],
    tables: [],
    columns: [],
    loading: false,
  })

  const mergedProjects = useMemo(() => {
    return projects.map((project) => {
      const status = statusRows.find((row) => row.siteId === project.siteId)
      return {
        ...project,
        connection: status?.connection || project.connection || {},
      }
    })
  }, [projects, statusRows])

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase()

    return mergedProjects.filter((project) => {
      const status = project.connection?.status || 'unknown'
      const credentials = project.credentials || {}
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const matchesSearch = !query || [
        project.name,
        project.siteId,
        project.enabled ? 'enabled' : 'disabled',
        status,
        credentials.database,
        credentials.host,
        credentials.user,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [mergedProjects, projectSearch, statusFilter])

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
      setLastSyncedAt(new Date().toLocaleTimeString())
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
    queueMicrotask(refresh)
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

  function clearForm() {
    setForm(emptyForm)
    setMessage('')
    setError('')
  }

  const clearNotice = useCallback(() => {
    setMessage('')
    setError('')
  }, [])

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null)
  }, [])

  async function saveProject(event) {
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
        setConfirmDialog({
          confirmLabel: 'Delete project',
          copy: 'This removes the project connection and its API keys. This cannot be undone.',
          onConfirm: async () => {
            setConfirmDialog((current) => ({ ...current, loading: true }))
            try {
              await deleteProject(project.siteId)
              setMessage(`Deleted ${project.siteId}.`)
              await refresh()
              setConfirmDialog(null)
            } catch (requestError) {
              setError(requestError.message)
              setConfirmDialog(null)
            }
          },
          title: `Delete ${project.siteId}?`,
          tone: 'danger',
        })
        return
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

  const openDatabaseBrowser = useCallback(async (siteId) => {
    if (!siteId) return
    setBrowser((current) => ({
      ...current,
      siteId,
      database: '',
      table: '',
      databases: [],
      tables: [],
      columns: [],
      loading: true,
    }))
    setError('')
    try {
      const databases = await listDatabases(siteId)
      setBrowser((current) => ({ ...current, siteId, databases, loading: false }))
    } catch (requestError) {
      setBrowser((current) => ({ ...current, loading: false }))
      setError(requestError.message)
    }
  }, [])

  const selectDatabase = useCallback(async (database) => {
    const currentSiteId = browser.siteId
    if (!currentSiteId) return
    setBrowser((current) => ({
      ...current,
      database,
      table: '',
      tables: [],
      columns: [],
      loading: true,
    }))
    setError('')
    try {
      const tables = await listDatabaseTables(currentSiteId, database)
      setBrowser((current) => ({ ...current, database, tables, loading: false }))
    } catch (requestError) {
      setBrowser((current) => ({ ...current, loading: false }))
      setError(requestError.message)
    }
  }, [browser.siteId])

  const selectTable = useCallback(async (table) => {
    const currentDatabase = browser.database
    const currentSiteId = browser.siteId
    if (!currentSiteId || !currentDatabase) return
    setBrowser((current) => ({ ...current, table, columns: [], loading: true }))
    setError('')
    try {
      const columns = await listTableColumns(currentSiteId, currentDatabase, table)
      setBrowser((current) => ({ ...current, table, columns, loading: false }))
    } catch (requestError) {
      setBrowser((current) => ({ ...current, loading: false }))
      setError(requestError.message)
    }
  }, [browser.database, browser.siteId])

  const value = {
    browser,
    clearForm,
    clearNotice,
    closeConfirmDialog,
    confirmDialog,
    copyText,
    editProject,
    error,
    filteredProjects,
    form,
    lastSyncedAt,
    loading,
    logout,
    logs,
    mergedProjects,
    message,
    openDatabaseBrowser,
    pingAll,
    projectSearch,
    refresh,
    removeApiKey,
    runProjectAction,
    saveProject,
    selectDatabase,
    selectTable,
    setForm,
    setProjectSearch,
    setStatusFilter,
    statusFilter,
    summary,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
