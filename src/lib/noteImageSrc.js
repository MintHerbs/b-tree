// src/lib/noteImageSrc.js
//
// Single source of truth for turning a note's `/notes/img/…` image path into a
// loadable URL. Note images live in the repo under `public/notes/img/…` and are
// served from GitHub raw (E-005 non-goal: they stay in the repo, not Supabase).
// A committed image is available on GitHub raw immediately, but only appears at
// the site's own `/notes/img/…` path after Vercel redeploys — so every renderer
// rewrites the path to GitHub raw to show images without waiting for a deploy.
//
// This used to be copy-pasted into the reader (MarkdownRenderer), the Monaco
// widget (AdminEditor) and — crucially — was MISSING from the WYSIWYG editor's
// image node view, so images showed only their alt text there. Keep every
// renderer pointed at this one function so they can't drift again.

/**
 * Rewrite a `/notes/img/…` path to its GitHub-raw URL; pass everything else
 * (blob URLs, absolute http(s) URLs, `draft://` markers) through untouched.
 * Falls back to the raw path when the GitHub env vars are unset (local dev,
 * where Vite serves `public/notes/img/…` at the site root directly).
 */
export function resolveNoteImageSrc(src = '') {
  if (!src.startsWith('/notes/img/')) return src

  const owner = import.meta.env.VITE_GITHUB_OWNER
  const repo = import.meta.env.VITE_GITHUB_REPO
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'

  if (!owner || !repo) return src

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${src}`
}
