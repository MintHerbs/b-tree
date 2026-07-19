// src/hooks/useImageCleanup.js

import { supabase } from '../lib/supabaseClient'
import { getFileSha, getFileContent, listDirectory, deleteFile } from '../lib/githubApi'

// Extract all image paths from a markdown string
function extractImages(markdown) {
  return [...markdown.matchAll(/!\[.*?\]\((\/notes\/img\/.*?)\)/g)]
    .map(m => m[1])
}

// Convert a relative file_path back to the full GitHub contents path
function toGithubPath(filePath) {
  return `src/content/notes/${filePath}.md`
}

export function useImageCleanup({ modules, isOwner }) {

  // ── SCAN ──────────────────────────────────────────────────────────────────
  // Scans .md files for a given moduleId (or all modules if moduleId is null).
  // For each file:
  //   - fetch its current SHA from GitHub (cheap, one API call per file)
  //   - if SHA matches image_map: skip (use cached images_used)
  //   - if SHA differs or no row: fetch content, extract images, upsert row
  // Returns { orphans, scannedCount, skippedCount }
  // orphans: array of { path, rawUrl } for images in the module's img folder
  //          that are not referenced by any scanned .md file

  async function runScan(moduleId, onProgress) {
    if (!isOwner) throw new Error('Owners only')

    // 1. Determine which modules to scan
    const modulesToScan = moduleId
      ? modules.filter(m => m.id === moduleId)
      : modules

    // 2. Build list of all .md files to check across selected modules.
    // Notes live at arbitrary depths (module.id/getting-started.md,
    // module.id/notes/foo.md, etc.) with no fixed subfolder convention, so
    // the only reliable source of "which .md files exist for this module"
    // is the module's own notes[] registry in modules.js — same convention
    // useEditorSave.js uses when it writes image_map.file_path.
    const allFiles = []
    for (const mod of modulesToScan) {
      for (const note of (mod.notes ?? [])) {
        const relativePath = `${mod.id}/${note.filename}`
        const githubPath = toGithubPath(relativePath)
        try {
          const sha = await getFileSha(githubPath)
          if (!sha) continue // file registered but missing on GitHub
          allFiles.push({ githubPath, relativePath, moduleId: mod.id, sha })
        } catch {
          // unreadable — skip silently
        }
      }
    }

    // 3. Load existing image_map rows for these files
    const { data: cachedRows } = await supabase
      .from('image_map')
      .select('file_path, images_used, file_sha')
      .in('file_path', allFiles.map(f => f.relativePath))

    const cacheMap = {}
    for (const row of (cachedRows ?? [])) {
      cacheMap[row.file_path] = row
    }

    // 4. For each file: use cache if SHA matches, else re-scan
    let scannedCount = 0
    let skippedCount = 0
    const allReferencedImages = new Set()
    const upsertBatch = []

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      onProgress?.(i + 1, allFiles.length, skippedCount)

      const cached = cacheMap[file.relativePath]

      if (cached && cached.file_sha === file.sha) {
        // SHA matches — use cached images_used
        cached.images_used.forEach(img => allReferencedImages.add(img))
        skippedCount++
        continue
      }

      // SHA changed or no cache — fetch and re-scan
      try {
        const content = await getFileContent(file.githubPath)
        const images  = extractImages(content)
        images.forEach(img => allReferencedImages.add(img))
        scannedCount++

        upsertBatch.push({
          file_path: file.relativePath,
          module_id: file.moduleId,
          images_used: images,
          file_sha: file.sha,
          last_scanned_at: new Date().toISOString(),
        })
      } catch {
        skippedCount++  // file unreadable — skip, don't crash the scan
      }
    }

    // 5. Batch upsert updated rows to Supabase
    if (upsertBatch.length > 0) {
      await supabase.from('image_map')
        .upsert(upsertBatch, { onConflict: 'file_path' })
    }

    // 6. List all images in the scanned module(s) image folders
    const allStoredImages = []
    for (const mod of modulesToScan) {
      try {
        const files = await listDirectory(`public/notes/img/${mod.id}`)
        files.forEach(f => {
          allStoredImages.push({
            path: `/notes/img/${mod.id}/${f.name}`,
            githubPath: f.path,
            // Raw URL for thumbnail preview — direct from GitHub CDN
            rawUrl: `https://raw.githubusercontent.com/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/${import.meta.env.VITE_GITHUB_BRANCH}/public/notes/img/${mod.id}/${f.name}`,
          })
        })
      } catch {
        // no images for this module yet
      }
    }

    // 7. Orphans = stored images not referenced by any scanned .md
    const orphans = allStoredImages.filter(
      img => !allReferencedImages.has(img.path)
    )

    return { orphans, scannedCount, skippedCount, totalFiles: allFiles.length }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  // Deletes a list of confirmed orphan images from GitHub.
  // Each item must have { githubPath } from the scan result.
  // Returns { deleted, failed }

  async function deleteOrphans(confirmedOrphans, onProgress) {
    if (!isOwner) throw new Error('Owners only')
    let deleted = 0
    let failed  = 0

    for (let i = 0; i < confirmedOrphans.length; i++) {
      const img = confirmedOrphans[i]
      onProgress?.(i + 1, confirmedOrphans.length)
      try {
        await deleteFile(img.githubPath, `chore: remove unused image ${img.githubPath}`)
        deleted++
      } catch {
        failed++  // log but don't abort — delete as many as possible
      }
    }

    return { deleted, failed }
  }

  return { runScan, deleteOrphans }
}
