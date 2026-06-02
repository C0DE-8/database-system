export function DashboardHeader({ onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">DBMS Gateway</p>
        <h1>Connection Management</h1>
      </div>
      <button type="button" className="secondary" onClick={onLogout}>
        Log out
      </button>
    </header>
  )
}

