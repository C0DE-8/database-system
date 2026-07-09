import { Navigate, useNavigate } from 'react-router-dom'
import { Auth } from '../pages/auth/Auth'

export function AuthRouter({ token, onLogin }) {
  const navigate = useNavigate()

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Auth
      onLogin={(nextToken) => {
        onLogin(nextToken)
        navigate('/dashboard', { replace: true })
      }}
    />
  )
}
