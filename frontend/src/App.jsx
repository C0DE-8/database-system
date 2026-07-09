import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthRouter } from './routes/AuthRouter'
import { DashboardRouter } from './routes/DashboardRouter'

function App() {
  const [token, setToken] = useState(localStorage.getItem('dbmsToken') || '')

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={token ? '/dashboard' : '/auth'} replace />}
        />
        <Route path="/auth" element={<AuthRouter token={token} onLogin={setToken} />} />
        <Route
          path="/dashboard"
          element={<DashboardRouter token={token} onLogout={() => setToken('')} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
