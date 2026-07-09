import styles from '../../pages/dashboard/Dashboard.module.css'

export function ConfirmDialog({ dialog, onCancel }) {
  if (!dialog) return null

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div>
          <p className={styles.eyebrow}>{dialog.tone === 'danger' ? 'Confirm delete' : 'Confirm action'}</p>
          <h2 id="confirm-title">{dialog.title}</h2>
          <p className={styles.muted}>{dialog.copy}</p>
        </div>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} onClick={onCancel} disabled={dialog.loading}>
            Cancel
          </button>
          <button
            type="button"
            className={dialog.tone === 'danger' ? styles.danger : styles.secondary}
            onClick={dialog.onConfirm}
            disabled={dialog.loading}
          >
            {dialog.loading ? 'Working...' : dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
