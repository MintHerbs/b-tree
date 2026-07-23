import { supabase } from './supabaseClient'

// All GitHub reads/writes are proxied through the admin-github-write Edge
// Function, which verifies the caller's Supabase session and
// allowed_directories server-side before touching GitHub. No GitHub token
// or write access exists in the browser.
async function invokeGithub(payload) {
  const { data, error } = await supabase.functions.invoke('admin-github-write', { body: payload })
  if (error) {
    // FunctionsHttpError carries the original Response on `context` — read it
    // so error messages like "GitHub commit failed: 409" survive the relay
    // (commitFileWithRetry matches on the "409" substring).
    const body = error.context?.json ? await error.context.json().catch(() => null) : null
    throw new Error(body?.error || error.message || 'GitHub proxy call failed')
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// ─── SHA ────────────────────────────────────────────────────────────────────
// Every GitHub write (PUT/DELETE) requires the current SHA of the file.
// Returns null if the file doesn't exist yet (new file — no SHA needed).
export async function getFileSha(path) {
  const { sha } = await invokeGithub({ op: 'getFileSha', path })
  return sha
}

// ─── COMMIT TEXT FILE ───────────────────────────────────────────────────────
// Creates or updates a text file on the branch.
// moduleId is only required when writing modules.js as a non-owner — the
// server uses it to prove the edit stays inside that module's own block.
export async function commitFile(path, content, message, moduleId) {
  return invokeGithub({ op: 'commitFile', path, content, message, moduleId })
}

// ─── COMMIT WITH RETRY ──────────────────────────────────────────────────────
// Wraps commitFile with automatic retry for 409 SHA conflicts.
// A 409 means another user committed to the same file between our SHA fetch
// and our write. We retry up to 3 times with exponential backoff (500ms,
// 1000ms, 1500ms). Each retry calls commitFile fresh which re-fetches the
// latest SHA internally — no manual SHA management needed here.
// All non-409 errors are rethrown immediately without retrying.
export async function commitFileWithRetry(path, content, message, moduleId) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await commitFile(path, content, message, moduleId)
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
export async function uploadImage(path, fileArrayBuffer) {
  const contentBase64 = btoa(
    new Uint8Array(fileArrayBuffer)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  )
  return invokeGithub({
    op: 'uploadImage',
    path,
    contentBase64,
    message: `assets: upload ${path.split('/').pop()}`,
  })
}

// ─── LIST DIRECTORY ─────────────────────────────────────────────────────────
// Returns the files in a GitHub directory as an array of file metadata objects.
// Returns an empty array if the directory doesn't exist (404) — callers should
// treat an empty result as "no files yet" rather than an error.
// The Edge Function already filters out subdirectories and .gitkeep entries.
export async function listDirectory(path) {
  const { files } = await invokeGithub({ op: 'listDirectory', path })
  return files
}

// ─── GET FILE CONTENT ────────────────────────────────────────────────────────
// Reads a text file from the repo and returns its decoded string content.
// GitHub stores file content as base64 — this decodes it back to plain text.
// Throws a descriptive error on any non-OK response (including 404).
export async function getFileContent(path) {
  const { content } = await invokeGithub({ op: 'getFileContent', path })
  return decodeURIComponent(escape(atob(content.replace(/\n/g, ''))))
}

// ─── DELETE FILE ─────────────────────────────────────────────────────────────
// Deletes a file from the repo. Requires the current SHA.
// Returns null silently if the file doesn't exist (already deleted).
// Owner-only server-side — this is the explicit, user-facing "Delete" action.
// For removing a stale copy after a rename/move, use cleanupFile instead.
export async function deleteFile(path, message) {
  return invokeGithub({ op: 'deleteFile', path, message })
}

// ─── DELETE MODULE (subject) ─────────────────────────────────────────────────
// Removes a subject's block from modules.js. Unlike commitFile (where the
// client computes the new file content), the removal itself runs server-side
// — the caller only sends the moduleId — because delete is locked to one
// account (T-045 phase B) and a client-computed "this commit is a deletion"
// flag would be trivially spoofable. The edge function verifies the caller's
// email before touching GitHub.
export async function deleteModule(moduleId, message) {
  return invokeGithub({ op: 'deleteModule', moduleId, message })
}

// ─── CLEANUP FILE ────────────────────────────────────────────────────────────
// Removes the old path after its content has already been committed
// elsewhere (rename/move). Any admin may run this — a contributor is allowed
// to rename or move their own notes, and that action isn't complete until the
// stale copy is gone. Not owner-gated server-side, unlike deleteFile.
export async function cleanupFile(path, message) {
  return invokeGithub({ op: 'cleanupFile', path, message })
}
