import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Auth } from './pages/auth/Auth'
import { Dashboard } from './pages/dashboard/Dashboard'
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
          path="/dashboard"
          element={
            token ? (
              <Dashboard onLogout={() => setToken('')} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
