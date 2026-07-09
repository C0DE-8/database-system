import styles from '../../pages/dashboard/Dashboard.module.css'

export function ProjectEditDialog({ admin }) {
  const { clearForm, form, saveProject, setForm } = admin

  if (!form.editingSiteId) return null

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section className={`${styles.confirmDialog} ${styles.editDialog}`} role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
        <div className={styles.panelHead}>
          <div>
            <p className={styles.eyebrow}>Edit connection</p>
            <h2 id="edit-project-title">Update {form.editingSiteId}</h2>
            <p className={styles.muted}>Change database credentials, pool settings, and project status.</p>
          </div>
          <button type="button" className={styles.secondary} onClick={clearForm}>
            Close
          </button>
        </div>

        <form className={styles.form} onSubmit={saveProject}>
          <Field label="Project name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Field label="Site ID" value={form.siteId} onChange={(value) => setForm({ ...form, siteId: value })} disabled required />
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
          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondary} onClick={clearForm}>
              Cancel
            </button>
            <button type="submit">Update project</button>
          </div>
        </form>
      </section>
    </div>
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
