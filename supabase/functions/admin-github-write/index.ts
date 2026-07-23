import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODULES_JS_PATH = 'src/components/layout/Sidebar/modules.js'

// Delete is locked to one account (T-045 phase B), regardless of how many
// accounts hold the `owner` role — see docs/specs/admin-drive-navigation.md §6.
const DELETE_AUTHORIZED_EMAIL = 'moon@mooner.dev'

// Removes a Subject's block from modules.js source. Ported from the client
// (useEditorModules.js) to here: this runs server-side, keyed only on
// moduleId, rather than trusting a client-computed "final content" for a
// delete — a client-supplied "this commit is a deletion" flag would be
// trivially spoofable, which would defeat the point of locking delete to one
// account.
function removeModuleSource(modulesJs: string, moduleId: string): string {
  const escaped = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startPattern = new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${escaped}',`, 'm')
  const startMatch = modulesJs.match(startPattern)
  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find subject "${moduleId}" in modules.js`)
  }
  const start = startMatch.index
  let index = start + 1
  let depth = 0
  for (; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        let end = index + 1
        if (modulesJs[end] === ',') end += 1
        if (modulesJs[end] === '\r') end += 1
        if (modulesJs[end] === '\n') end += 1
        return `${modulesJs.slice(0, start)}\n${modulesJs.slice(end)}`
      }
    }
  }
  throw new Error(`Could not parse subject "${moduleId}" in modules.js`)
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

    const { op, path, content, contentBase64, message, moduleId } = await req.json()

    if (!op) {
      return json({ error: 'Missing op' }, 400)
    }

    // deleteModule has no `path` — it's keyed on moduleId and the target path
    // (modules.js) is fixed server-side, not client-supplied.
    if (op !== 'deleteModule') {
      if (!path) {
        return json({ error: 'Missing path' }, 400)
      }
      if (!isPathAllowed(path, profile.role, profile.allowed_directories ?? [])) {
        return json({ error: 'Path is outside your allowed directories' }, 403)
      }
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
        // The user-facing "Delete" action — locked to one account (T-045
        // phase B), not just the owner role. Distinct from 'cleanupFile'
        // below, which the same rename/move flows a contributor is allowed
        // to run also depend on.
        if (!message) return json({ error: 'Missing message' }, 400)
        if (profile.role !== 'owner' || callerData.user.email !== DELETE_AUTHORIZED_EMAIL) {
          return json({ error: 'Only the site owner can delete files' }, 403)
        }
        return await deleteFromGithub(path, message)
      }

      case 'deleteModule': {
        // Removes a Subject's block from modules.js. Locked to one account
        // (T-045 phase B) — verified via the caller's authenticated Supabase
        // session (callerData.user.email), not the client-editable
        // admin_users.email column.
        if (!moduleId || !message) return json({ error: 'Missing moduleId or message' }, 400)
        if (profile.role !== 'owner' || callerData.user.email !== DELETE_AUTHORIZED_EMAIL) {
          return json({ error: 'Only the site owner can delete a subject' }, 403)
        }
        const res = await fetch(`${contentsUrl(MODULES_JS_PATH)}?ref=${githubBranch}`, { headers: ghHeaders })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          return json({ error: `Failed to read modules.js (${res.status}): ${errorData.message || res.statusText}` }, res.status)
        }
        const data = await res.json()
        const currentModulesJs = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
        let updatedModulesJs: string
        try {
          updatedModulesJs = removeModuleSource(currentModulesJs, moduleId)
        } catch (err) {
          return json({ error: (err as Error).message }, 400)
        }
        const sha: string | null = await fetchSha(MODULES_JS_PATH)
        const commitRes = await fetch(contentsUrl(MODULES_JS_PATH), {
          method: 'PUT',
          headers: ghHeaders,
          body: JSON.stringify({
            message,
            content: btoa(unescape(encodeURIComponent(updatedModulesJs))),
            branch: githubBranch,
            ...(sha ? { sha } : {}),
          }),
        })
        if (!commitRes.ok) return json({ error: `GitHub commit failed: ${commitRes.status}` }, commitRes.status)
        return json(await commitRes.json())
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
