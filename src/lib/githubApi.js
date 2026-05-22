const OWNER  = import.meta.env.VITE_GITHUB_OWNER
const REPO   = import.meta.env.VITE_GITHUB_REPO
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH
const TOKEN  = import.meta.env.VITE_GITHUB_TOKEN

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
}

// Get file SHA (needed for updates)
export async function getFileSha(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return null
  const data = await res.json()
  return data.sha ?? null
}

// Commit a text file
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

// Upload a binary file (image)
export async function uploadImage(path, fileArrayBuffer) {
  const sha = await getFileSha(path)
  const base64 = btoa(
    new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
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

// List files in a directory (to count existing images)
export async function listDirectory(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return []
  return res.json()
}

// Get raw file content
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
