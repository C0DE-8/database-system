import { useState } from 'react'
import { login } from '../../api/auth.routes'
import styles from './Auth.module.css'

export function Auth({ onLogin }) {
  const [loginForm, setLoginForm] = useState({
    email: 'admin@example.com',
    password: 'change-me-now',
  })
  const [error, setError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    try {
      const result = await login(loginForm)
      localStorage.setItem('dbmsToken', result.token)
      onLogin(result.token)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.loginPanel}>
        <div>
          <p className={styles.eyebrow}>DBMS Gateway</p>
          <h1>Admin Console</h1>
        </div>
        <form className={styles.form} onSubmit={handleLogin}>
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
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </section>
    </main>
  )
}
