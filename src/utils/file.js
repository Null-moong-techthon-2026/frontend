// Lower-case extension without the dot ('보고서.PDF' -> 'pdf'); '' when there is none.
export const fileExtension = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

// 1536 -> '1.5KB'
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
