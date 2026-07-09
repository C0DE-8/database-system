import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ProjectEditDialog } from '../../components/projects/ProjectEditDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ToastViewport } from '../../components/ui/ToastViewport'
import { AdminProvider } from './AdminContext'
import { useAdmin } from './adminContextCore'
import styles from '../dashboard/Dashboard.module.css'

const pageMeta = {
  '/dashboard': ['Overview', 'A fast health check for gateway activity, project status, and recent changes.'],
  '/projects': ['Projects', 'Search, inspect, edit, and manage every project connection.'],
  '/browser': ['Database Browser', 'Explore databases, tables, and columns from connected MySQL servers.'],
  '/activity': ['Activity', 'Review gateway events and admin actions without letting logs flood the workspace.'],
  '/settings': ['Project Setup', 'Create or update database connections and connection pool settings.'],
}

export function AdminLayout({ onLogout }) {
  return (
    <AdminProvider onLogout={onLogout}>
      <AdminFrame />
    </AdminProvider>
  )
}

function AdminFrame() {
  const admin = useAdmin()
  const {
    clearNotice,
    closeConfirmDialog,
    confirmDialog,
    error,
    logout,
    message,
    refresh,
  } = admin
  const location = useLocation()
  const currentPath = location.pathname.startsWith('/browser/') ? '/browser' : location.pathname
  const [title, copy] = pageMeta[currentPath] || pageMeta['/dashboard']

  useEffect(() => {
    if (!message && !error) return undefined

    const timeoutId = window.setTimeout(clearNotice, 5200)
    return () => window.clearTimeout(timeoutId)
  }, [clearNotice, error, message])

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>DBMS Gateway</p>
          <h1>{title}</h1>
          <p className={styles.headerCopy}>{copy}</p>
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

      <nav className={styles.navTabs} aria-label="Admin navigation">
        <NavLink to="/dashboard">Overview</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/browser">Database Browser</NavLink>
        <NavLink to="/activity">Activity</NavLink>
        <NavLink to="/settings">Setup</NavLink>
      </nav>

      <Outlet />
      <ProjectEditDialog admin={admin} />
      <ToastViewport error={error} message={message} onDismiss={clearNotice} />
      <ConfirmDialog dialog={confirmDialog} onCancel={closeConfirmDialog} />
    </main>
  )
}
