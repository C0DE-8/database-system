import styles from '../../pages/dashboard/Dashboard.module.css'

export function MetadataTable({ activeKey, columns, empty, getKey, onRowClick, rows }) {
  if (!rows.length) {
    return <p className={styles.muted}>{empty}</p>
  }

  return (
    <div className={styles.tableScroller}>
      <table className={styles.metadataTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = getKey(row)
            return (
              <tr
                className={activeKey === key ? styles.activeTableRow : ''}
                onClick={() => onRowClick?.(row)}
                key={key}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
