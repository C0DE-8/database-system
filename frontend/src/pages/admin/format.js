export function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString()
}
