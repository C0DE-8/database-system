import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DatabaseBrowserPanel } from '../../components/browser/DatabaseBrowserPanel'
import { useAdmin } from '../admin/adminContextCore'

export function Browser({ standalone = true }) {
  const {
    browser,
    mergedProjects,
    openDatabaseBrowser,
    selectDatabase,
    selectTable,
  } = useAdmin()
  const { siteId } = useParams()

  useEffect(() => {
    if (siteId && siteId !== browser.siteId) {
      queueMicrotask(() => {
        openDatabaseBrowser(siteId)
      })
    }
  }, [browser.siteId, openDatabaseBrowser, siteId])

  return (
    <DatabaseBrowserPanel
      browser={browser}
      onConnectionChange={openDatabaseBrowser}
      onDatabaseSelect={selectDatabase}
      onTableSelect={selectTable}
      projects={mergedProjects}
      standalone={standalone}
    />
  )
}
