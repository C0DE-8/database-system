import { useState } from 'react'
import { login } from '../../api/auth'
import { API_BASE_URL } from '../../api/client'
import { setToken } from '../../token'
import styles from './Auth.module.css'

export function Auth({ onLogin }) {
  const [form, setForm] = useState({
    email: 'admin@example.com',
    password: 'change-me-now',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(form)
      setToken(result.token)
      onLogin(result.token)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>DBMS Gateway</p>
        <h1>Admin Console</h1>
        <p className={styles.copy}>Sign in to manage project database connections and API keys.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <p className={styles.endpoint}>API: {API_BASE_URL}</p>
      </section>
    </main>
  )
}
