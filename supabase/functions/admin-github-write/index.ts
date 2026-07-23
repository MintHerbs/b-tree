import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Note CONTENT no longer lives in modules.js — it's in the Supabase `notes`
// table (E-005/T-043) — so only owners ever write modules.js (creating,
// removing, or renaming a subject). Contributors never touch it, hence no
// special-case allowance below; it simply falls through to the directory
// check, which their paths match for their own notes/images only.
function isPathAllowed(path: string, role: string, allowedDirectories: string[]): boolean {
  if (role === 'owner') return true
  // modules.js is owner-only now (falls through to the directory check, which
  // it never matches). Contributors may write only their own notes/images —
  // and note .md writes here are just optional backups; the source of truth is
  // the notes table, guarded by RLS.
  return allowedDirectories.some(dir =>
    path.startsWith(`src/content/notes/${dir}/`) ||
    path.startsWith(`public/notes/img/${dir}/`)
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    const githubOwner = Deno.env.get('GITHUB_OWNER')
    const githubRepo = Deno.env.get('GITHUB_REPO')
    const githubBranch = Deno.env.get('GITHUB_BRANCH')

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !githubToken || !githubOwner || !githubRepo || !githubBranch) {
      throw new Error('Function environment is not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData.user) {
      return json({ error: 'Not authenticated' }, 401)
    }

    const { data: profile, error: profileError } = await adminClient
      .from('admin_users')
      .select('role, allowed_directories')
      .eq('id', callerData.user.id)
      .single()

    if (profileError || !profile) {
      return json({ error: 'Not an admin user' }, 403)
    }

    const { op, path, content, contentBase64, message } = await req.json()

    if (!op || !path) {
      return json({ error: 'Missing op or path' }, 400)
    }

    if (!isPathAllowed(path, profile.role, profile.allowed_directories ?? [])) {
      return json({ error: 'Path is outside your allowed directories' }, 403)
    }

    const ghHeaders = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    }
    const contentsUrl = (p: string) =>
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${p}`

    async function fetchSha(p: string): Promise<string | null> {
      const res = await fetch(`${contentsUrl(p)}?ref=${githubBranch}`, { headers: ghHeaders })
      if (res.status === 404) return null
      const data = await res.json()
      return data.sha ?? null
    }

    async function deleteFromGithub(p: string, msg: string) {
      const sha = await fetchSha(p)
      if (!sha) return json(null)
      const res = await fetch(contentsUrl(p), {
        method: 'DELETE',
        headers: ghHeaders,
        body: JSON.stringify({ message: msg, sha, branch: githubBranch }),
      })
      if (!res.ok) return json({ error: `GitHub delete failed: ${res.status}` }, res.status)
      return json(await res.json())
    }

    switch (op) {
      case 'getFileSha': {
        return json({ sha: await fetchSha(path) })
      }

      case 'listDirectory': {
        const res = await fetch(`${contentsUrl(path)}?ref=${githubBranch}`, { headers: ghHeaders })
        if (res.status === 404) return json({ files: [] })
        const files = await res.json()
        const filtered = Array.isArray(files)
          ? files.filter((f: { type: string; name: string }) => f.type === 'file' && f.name !== '.gitkeep')
          : []
        return json({ files: filtered })
      }

      case 'getFileContent': {
        const res = await fetch(`${contentsUrl(path)}?ref=${githubBranch}`, { headers: ghHeaders })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          return json({ error: `Failed to read file (${res.status}): ${errorData.message || res.statusText}` }, res.status)
        }
        const data = await res.json()
        return json({ content: data.content })
      }

      case 'commitFile': {
        if (typeof content !== 'string' || !message) {
          return json({ error: 'Missing content or message' }, 400)
        }
        // Path authorization already enforced by isPathAllowed above (owner for
        // modules.js; own notes/img dirs for contributors). No modules.js
        // block-scoping needed anymore — note content is in the DB.
        const sha: string | null = await fetchSha(path)
        const body = {
          message,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: githubBranch,
          ...(sha ? { sha } : {}),
        }
        const res = await fetch(contentsUrl(path), { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) })
        if (!res.ok) return json({ error: `GitHub commit failed: ${res.status}` }, res.status)
        return json(await res.json())
      }

      case 'uploadImage': {
        if (typeof contentBase64 !== 'string' || !message) {
          return json({ error: 'Missing contentBase64 or message' }, 400)
        }
        const sha = await fetchSha(path)
        const body = {
          message,
          content: contentBase64,
          branch: githubBranch,
          ...(sha ? { sha } : {}),
        }
        const res = await fetch(contentsUrl(path), { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          return json({ error: `Image upload failed: ${res.status} — ${errBody.message}` }, res.status)
        }
        return json(await res.json())
      }

      case 'deleteFile': {
        // The user-facing "Delete" action — owner-only per T-031. Distinct
        // from 'cleanupFile' below, which the same rename/move flows a
        // contributor is allowed to run also depend on.
        if (!message) return json({ error: 'Missing message' }, 400)
        if (profile.role !== 'owner') {
          return json({ error: 'Only owners can delete files' }, 403)
        }
        return await deleteFromGithub(path, message)
      }

      case 'cleanupFile': {
        // Removes the stale copy left behind after a rename/move whose
        // content has already landed at its new path. Any admin may trigger
        // a same-directory rename/move (isPathAllowed already scoped this
        // above), so this is intentionally not owner-gated like 'deleteFile'.
        if (!message) return json({ error: 'Missing message' }, 400)
        return await deleteFromGithub(path, message)
      }

      default:
        return json({ error: `Unknown op: ${op}` }, 400)
    }
  } catch (error) {
    return json({ error: error.message || 'Unexpected error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
