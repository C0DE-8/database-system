import { CustomSelect } from '../ui/CustomSelect'
import { MetadataTable } from './MetadataTable'
import styles from '../../pages/dashboard/Dashboard.module.css'

export function DatabaseBrowserPanel({
  browser,
  onConnectionChange,
  onDatabaseSelect,
  onTableSelect,
  projects,
  standalone = true,
}) {
  return (
    <section className={`${styles.panel} ${styles.browserPanel} ${standalone ? styles.fullPanel : ''}`}>
      <div className={styles.panelHead}>
        <div>
          <h2>Database Browser</h2>
          <p className={styles.muted}>Browse schemas, tables, and columns from a connected MySQL server.</p>
        </div>
      </div>

      <CustomSelect
        label="Connection"
        onChange={onConnectionChange}
        options={projects.map((project) => ({
          description: `${project.credentials?.host || 'localhost'}:${project.credentials?.port || 3306}`,
          label: project.name,
          value: project.siteId,
        }))}
        placeholder="Select a project"
        value={browser.siteId}
      />

      {browser.loading && <p className={styles.muted}>Loading database metadata...</p>}

      {!browser.siteId && (
        <div className={styles.emptyState}>
          <strong>Select a connection</strong>
          <span>Choose a project to list all databases on that MySQL server.</span>
        </div>
      )}

      {browser.siteId && (
        <div className={styles.browserTableGrid}>
          <div className={styles.browserColumn}>
            <div className={styles.browserTitle}>Databases ({browser.databases.length})</div>
            <MetadataTable
              activeKey={browser.database}
              columns={[
                { key: 'name', label: 'Database' },
                {
                  key: 'system',
                  label: 'Type',
                  render: (database) => (database.system ? 'System' : 'User'),
                },
                { key: 'charset', label: 'Charset' },
                { key: 'collation', label: 'Collation' },
              ]}
              empty="No databases found."
              getKey={(database) => database.name}
              onRowClick={(database) => onDatabaseSelect(database.name)}
              rows={browser.databases}
            />
          </div>

          <div className={styles.browserColumn}>
            <div className={styles.browserTitle}>
              Tables {browser.database ? `in ${browser.database}` : ''}
            </div>
            <MetadataTable
              activeKey={browser.table}
              columns={[
                { key: 'name', label: 'Table' },
                { key: 'type', label: 'Type' },
                { key: 'engine', label: 'Engine' },
                {
                  key: 'rowCount',
                  label: 'Rows',
                  render: (table) => table.rowCount ?? 0,
                },
              ]}
              empty={browser.database ? 'No tables found.' : 'Choose a database first.'}
              getKey={(table) => table.name}
              onRowClick={(table) => onTableSelect(table.name)}
              rows={browser.database ? browser.tables : []}
            />
          </div>
        </div>
      )}

      {browser.table && (
        <div className={styles.columnsPanel}>
          <div className={styles.browserTitle}>Columns in {browser.table}</div>
          <MetadataTable
            columns={[
              { key: 'position', label: '#' },
              { key: 'name', label: 'Column' },
              { key: 'type', label: 'Type' },
              {
                key: 'nullable',
                label: 'Null',
                render: (column) => (column.nullable === 'YES' ? 'Yes' : 'No'),
              },
              {
                key: 'columnKey',
                label: 'Key',
                render: (column) => column.columnKey || '-',
              },
              {
                key: 'defaultValue',
                label: 'Default',
                render: (column) => column.defaultValue ?? 'NULL',
              },
              {
                key: 'extra',
                label: 'Extra',
                render: (column) => column.extra || '-',
              },
            ]}
            empty="No columns found."
            getKey={(column) => column.name}
            rows={browser.columns}
          />
        </div>
      )}
    </section>
  )
}
