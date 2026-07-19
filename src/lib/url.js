const SAFE_SCHEMES = ['http:', 'https:', 'mailto:']

// Allowlists URL schemes to block `javascript:`/`data:`/`vbscript:` links
// from executing when rendered as an href (stored XSS via RichPopover blocks).
export function isSafeUrl(url) {
  if (!url) return false

  try {
    const { protocol } = new URL(url)
    return SAFE_SCHEMES.includes(protocol)
  } catch {
    return false
  }
}
