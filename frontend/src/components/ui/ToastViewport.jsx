import styles from '../../pages/dashboard/Dashboard.module.css'

export function ToastViewport({ error, message, onDismiss }) {
  if (!message && !error) return null

  return (
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="true">
      <div className={error ? styles.toastError : styles.toast}>
        <div>
          <strong>{error ? 'Action failed' : 'Done'}</strong>
          <span>{error || message}</span>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
          x
        </button>
      </div>
    </div>
  )
}
