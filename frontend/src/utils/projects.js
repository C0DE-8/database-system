export function mergeProjects(statusRows, detailRows) {
  const detailsBySiteId = new Map(detailRows.map((project) => [project.siteId, project]))

  return statusRows.map((statusProject) => ({
    ...statusProject,
    ...(detailsBySiteId.get(statusProject.siteId) || {}),
    connection: statusProject.connection,
    poolOpen: statusProject.poolOpen,
  }))
}

