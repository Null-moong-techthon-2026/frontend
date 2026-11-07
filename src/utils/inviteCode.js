// An invitation code as people type it: with spaces, in lower case, or the whole link pasted.
// The server compares codes exactly (a lower-case "bl-..." is "not found"), so tidy it up first:
//   '  bl-a99f...  '                               -> 'BL-A99F...'
//   'https://site/invite/staff/AbC_def-1'          -> 'AbC_def-1'   (link tokens are case-sensitive)
export function cleanInviteCode(value) {
  let code = String(value ?? '').trim()
  const link = code.match(/\/invite\/(?:staff\/)?([^/?#\s]+)/)
  if (link) code = link[1]
  return /^bl-/i.test(code) ? code.toUpperCase() : code
}
