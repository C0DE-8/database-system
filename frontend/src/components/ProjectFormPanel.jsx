export function ProjectFormPanel({
  projectForm,
  message,
  error,
  onSubmit,
  onClear,
  onChange,
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Add / Edit Project</h2>
        <button type="button" className="secondary" onClick={onClear}>
          Clear
        </button>
      </div>
      <form className="form grid-form" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={projectForm.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Shop Website"
            required
          />
        </label>
        <label>
          Site ID
          <input
            value={projectForm.siteId}
            onChange={(event) => onChange({ siteId: event.target.value })}
            placeholder="shop"
            disabled={Boolean(projectForm.editingSiteId)}
            required
          />
        </label>
        <label>
          Host
          <input
            value={projectForm.host}
            onChange={(event) => onChange({ host: event.target.value })}
            placeholder="localhost"
          />
        </label>
        <label>
          Port
          <input
            type="number"
            value={projectForm.port}
            onChange={(event) => onChange({ port: event.target.value })}
          />
        </label>
        <label>
          Database
          <input
            value={projectForm.database}
            onChange={(event) => onChange({ database: event.target.value })}
            placeholder="shop_db"
            required={!projectForm.editingSiteId}
          />
        </label>
        <label>
          User
          <input
            value={projectForm.user}
            onChange={(event) => onChange({ user: event.target.value })}
            placeholder="root"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={projectForm.password}
            onChange={(event) => onChange({ password: event.target.value })}
            placeholder="Optional"
          />
        </label>
        <label>
          Pool Size
          <input
            type="number"
            value={projectForm.connectionLimit}
            onChange={(event) => onChange({ connectionLimit: event.target.value })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={projectForm.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
          />
          Enabled
        </label>
        <button type="submit">Save Project</button>
        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

