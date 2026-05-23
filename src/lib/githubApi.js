const OWNER  = import.meta.env.VITE_GITHUB_OWNER
const REPO   = import.meta.env.VITE_GITHUB_REPO
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH
const TOKEN  = import.meta.env.VITE_GITHUB_TOKEN

// Standard headers for all GitHub API requests
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
}

// ─── SHA ────────────────────────────────────────────────────────────────────
// Every GitHub write (PUT/DELETE) requires the current SHA of the file.
// Returns null if the file doesn't exist yet (new file — no SHA needed).
export async function getFileSha(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return null
  const data = await res.json()
  return data.sha ?? null
}

// ─── COMMIT TEXT FILE ───────────────────────────────────────────────────────
// Creates or updates a text file on the branch.
// Fetches the latest SHA first so it never writes on a stale base.
// content is a plain string — btoa/encodeURIComponent handles unicode safely.
export async function commitFile(path, content, message) {
  const sha = await getFileSha(path)
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'PUT', headers, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`GitHub commit failed: ${res.status}`)
  return res.json()
}

// ─── COMMIT WITH RETRY ──────────────────────────────────────────────────────
// Wraps commitFile with automatic retry for 409 SHA conflicts.
// A 409 means another user committed to the same file between our SHA fetch
// and our write. We retry up to 3 times with exponential backoff (500ms,
// 1000ms, 1500ms). Each retry calls commitFile fresh which re-fetches the
// latest SHA internally — no manual SHA management needed here.
// All non-409 errors are rethrown immediately without retrying.
export async function commitFileWithRetry(path, content, message) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await commitFile(path, content, message)
    } catch (err) {
      if (!err.message?.includes('409')) throw err
      lastError = err
      if (attempt === 4) break
      // Wait before retrying — gives the conflicting commit time to settle
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))
    }
  }
  throw lastError
}

// ─── UPLOAD BINARY FILE (images) ────────────────────────────────────────────
// Uploads a binary file (png, jpg, svg) to the repo.
// fileArrayBuffer must be an ArrayBuffer — never pass a data: URL or File object.
// GitHub requires base64-encoded content for binary files.
// If the file already exists at that path, fetches its SHA and overwrites it.
export async function uploadImage(path, fileArrayBuffer) {
  const sha = await getFileSha(path)
  const base64 = btoa(
    new Uint8Array(fileArrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  )
  const body = {
    message: `assets: upload ${path.split('/').pop()}`,
    content: base64,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'PUT', headers, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`)
  return res.json()
}

// ─── LIST DIRECTORY ─────────────────────────────────────────────────────────
// Returns the files in a GitHub directory as an array of file metadata objects.
// Returns an empty array if the directory doesn't exist (404) — callers should
// treat an empty result as "no files yet" rather than an error.
//
// FIX: Two filters are applied to the raw GitHub response before returning:
//   1. f.type === 'file'   — excludes subdirectory entries from the count
//   2. f.name !== '.gitkeep' — excludes placeholder files used to keep empty
//      folders alive in git. GitHub inlines .gitkeep content as a data: URL
//      in the download_url field. If callers iterate download_url values,
//      fetch() on a data: URL throws a CORS error because it is not HTTP.
export async function listDirectory(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return []
  const files = await res.json()
  return files.filter(f => f.type === 'file' && f.name !== '.gitkeep')
}

// ─── GET FILE CONTENT ────────────────────────────────────────────────────────
// Reads a text file from the repo and returns its decoded string content.
// GitHub stores file content as base64 — this decodes it back to plain text.
// Throws a descriptive error on any non-OK response (including 404).
export async function getFileContent(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(`Failed to read file (${res.status}): ${errorData.message || res.statusText}`)
  }
  const data = await res.json()
  return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
}

// ─── DELETE FILE ─────────────────────────────────────────────────────────────
// Deletes a file from the repo. Requires the current SHA.
// Returns null silently if the file doesn't exist (already deleted).
export async function deleteFile(path, message) {
  const sha = await getFileSha(path)
  if (!sha) return null
  const body = {
    message,
    sha,
    branch: BRANCH,
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'DELETE', headers, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`GitHub delete failed: ${res.status}`)
  return res.json()
}