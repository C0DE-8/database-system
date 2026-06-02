import { useState } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('dbmsToken') || '')

  if (!token) {
    return <LoginPage onLogin={setToken} />
  }

  return <DashboardPage token={token} onLogout={() => setToken('')} />
}

export default App
