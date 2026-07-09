import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Activity } from './pages/activity/Activity'
import { AdminLayout } from './pages/admin/AdminLayout'
import { Auth } from './pages/auth/Auth'
import { Browser } from './pages/browser/Browser'
import { Overview } from './pages/overview/Overview'
import { Projects } from './pages/projects/Projects'
import { Settings } from './pages/settings/Settings'
import { getToken } from './token'

function App() {
  const [token, setToken] = useState(getToken())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/auth'} replace />} />
        <Route
          path="/auth"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth onLogin={setToken} />
            )
          }
        />
        <Route
          element={
            token ? (
              <AdminLayout onLogout={() => setToken('')} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/browser/:siteId" element={<Browser />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
