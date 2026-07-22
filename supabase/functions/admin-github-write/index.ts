import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Shared registry file — every save (including a correctly-scoped contributor's)
// updates this, so it's allowed regardless of allowed_directories.
const MODULES_JS_PATH = 'src/components/layout/Sidebar/modules.js'

function isPathAllowed(path: string, role: string, allowedDirectories: string[]): boolean {
  if (role === 'owner') return true
  if (path === MODULES_JS_PATH) return true
  return allowedDirectories.some(dir =>
    path.startsWith(`src/content/notes/${dir}/`) ||
    path.startsWith(`public/notes/img/${dir}/`)
  )
}

// Locates a module's `{ id: '<moduleId>', ... }` block by brace-depth matching —
// ported from the identical parser in src/hooks/useEditorSave.js so the
// boundaries this checks against match what the client actually edits.
function findModuleBlock(modulesJs: string, moduleId: string): { start: number; end: number } {
  const escapedId = moduleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let startMatch = modulesJs.match(new RegExp(`\\n\\s*\\{\\s*\\n\\s*id:\\s*'${escapedId}',`, 'm'))
  if (!startMatch) {
    startMatch = modulesJs.match(new RegExp(`\\{\\s*id:\\s*'${escapedId}'\\s*,`, 'm'))
  }
  if (!startMatch || startMatch.index == null) {
    throw new Error(`Could not find module: ${moduleId}`)
  }
  const start = startMatch.index
  let depth = 0
  for (let index = start + 1; index < modulesJs.length; index++) {
    const char = modulesJs[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return { start, end: index + 1 }
    }
  }
  throw new Error(`Could not parse module: ${moduleId}`)
}

// A contributor may only ever touch their own module's block inside the
// shared modules.js registry. Proves that by requiring everything outside
// that block's old span to appear verbatim, unmoved, in the new content —
// the block itself can grow/shrink/rewrite freely, but nothing else may.
function isScopedModulesJsEdit(oldContent: string, newContent: string, moduleId: string): boolean {
  let block
  try {
    block = findModuleBlock(oldContent, moduleId)
  } catch {
    return false
  }
  const prefix = oldContent.slice(0, block.start)
  const suffix = oldContent.slice(block.end)
  if (newContent.length < prefix.length + suffix.length) return false
  return newContent.startsWith(prefix) && newContent.endsWith(suffix)
}

function decodeGithubContent(base64WithNewlines: string): string {
  const bytes = Uint8Array.from(atob(base64WithNewlines.replace(/\n/g, '')), c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
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
        let sha: string | null
        if (path === MODULES_JS_PATH && profile.role !== 'owner') {
          const allowedDirs: string[] = profile.allowed_directories ?? []
          if (!moduleId || !allowedDirs.includes(moduleId)) {
            return json({ error: 'moduleId is required and must be one of your allowed directories' }, 403)
          }
          const currentRes = await fetch(`${contentsUrl(path)}?ref=${githubBranch}`, { headers: ghHeaders })
          if (!currentRes.ok) {
            return json({ error: 'Could not verify existing modules.js content' }, 409)
          }
          const currentData = await currentRes.json()
          const oldContent = decodeGithubContent(currentData.content)
          if (!isScopedModulesJsEdit(oldContent, content, moduleId)) {
            return json({ error: 'Edit to modules.js touches more than your own module' }, 403)
          }
          sha = currentData.sha ?? null
        } else {
          sha = await fetchSha(path)
        }
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
        if (!message) return json({ error: 'Missing message' }, 400)
        if (profile.role !== 'owner') {
          return json({ error: 'Only owners can delete files' }, 403)
        }
        const sha = await fetchSha(path)
        if (!sha) return json(null)
        const res = await fetch(contentsUrl(path), {
          method: 'DELETE',
          headers: ghHeaders,
          body: JSON.stringify({ message, sha, branch: githubBranch }),
        })
        if (!res.ok) return json({ error: `GitHub delete failed: ${res.status}` }, res.status)
        return json(await res.json())
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
