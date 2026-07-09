import { Navigate } from 'react-router-dom'
import { Dashboard } from '../pages/dashboard/Dashboard'

export function DashboardRouter({ token, onLogout }) {
  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return <Dashboard token={token} onLogout={onLogout} />
}
