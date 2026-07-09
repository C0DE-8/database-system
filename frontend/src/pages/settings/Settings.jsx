import { useAdmin } from '../admin/adminContextCore'
import styles from '../dashboard/Dashboard.module.css'

export function Settings() {
  const admin = useAdmin()

  return (
    <section className={styles.settingsGrid}>
      <ProjectForm admin={admin} />
      <section className={styles.panel}>
        <h2>Admin Notes</h2>
        <div className={styles.noteStack}>
          <p>Use Setup to create a connection profile for each application or tenant database.</p>
          <p>Passwords are encrypted by the backend before storage. Updating a project replaces the saved connection credentials.</p>
          <p>Use Database Browser after saving a project to confirm the server can list schemas and tables.</p>
        </div>
      </section>
    </section>
  )
}

function ProjectForm({ admin }) {
  const { clearForm, form, saveProject, setForm } = admin

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>{form.editingSiteId ? `Edit ${form.editingSiteId}` : 'Add Project'}</h2>
        {form.editingSiteId && (
          <button type="button" className={styles.secondary} onClick={clearForm}>Cancel</button>
        )}
      </div>
      <form className={styles.form} onSubmit={saveProject}>
        <Field label="Project name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Field label="Site ID" value={form.siteId} onChange={(value) => setForm({ ...form, siteId: value })} disabled={Boolean(form.editingSiteId)} required />
        <Field label="Host" value={form.host} onChange={(value) => setForm({ ...form, host: value })} />
        <Field label="Port" type="number" value={form.port} onChange={(value) => setForm({ ...form, port: value })} />
        <Field label="Database" value={form.database} onChange={(value) => setForm({ ...form, database: value })} required />
        <Field label="User" value={form.user} onChange={(value) => setForm({ ...form, user: value })} />
        <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
        <Field label="Pool size" type="number" value={form.connectionLimit} onChange={(value) => setForm({ ...form, connectionLimit: value })} />
        <Field label="Queue limit" type="number" value={form.queueLimit} onChange={(value) => setForm({ ...form, queueLimit: value })} />
        <label className={styles.checkbox}>
          <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
          Enabled
        </label>
        <button type="submit">{form.editingSiteId ? 'Update project' : 'Save project'}</button>
      </form>
    </section>
  )
}

function Field({ disabled, label, onChange, required, type = 'text', value }) {
  return (
    <label>
      {label}
      <input
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}
