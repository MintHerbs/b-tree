import { beforeEach, describe, expect, it, vi } from 'vitest'

function mockResponse({ status = 200, ok = true, json = async () => ({}) } = {}) {
  return { status, ok, json }
}

async function loadGithubApi() {
  vi.resetModules()
  vi.stubEnv('VITE_GITHUB_OWNER', 'acme')
  vi.stubEnv('VITE_GITHUB_REPO', 'repo')
  vi.stubEnv('VITE_GITHUB_BRANCH', 'main')
  vi.stubEnv('VITE_GITHUB_TOKEN', 'token')
  return await import('./githubApi.js')
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  globalThis.fetch = vi.fn()
})

describe('getFileSha', () => {
  it('returns null on 404 (file does not exist)', async () => {
    const { getFileSha } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(mockResponse({ status: 404, ok: false }))

    await expect(getFileSha('some/path.md')).resolves.toBeNull()
  })

  it('returns the sha on a successful response', async () => {
    const { getFileSha } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({ json: async () => ({ sha: 'abc123' }) })
    )

    await expect(getFileSha('some/path.md')).resolves.toBe('abc123')
  })

  it('throws on a 403 rate-limit response instead of reporting "no sha"', async () => {
    const { getFileSha } = await loadGithubApi()

    // A 403 (rate limit) must NOT be collapsed into null — an existing file
    // would then be treated as new, causing commitFile to PUT without a sha
    // (GitHub 422) and deleteFile to silently no-op.
    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({ status: 403, ok: false, json: async () => ({ message: 'API rate limit exceeded' }) })
    )

    await expect(getFileSha('some/path.md')).rejects.toThrow('403')
  })

  it('throws on a 401 auth response', async () => {
    const { getFileSha } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({ status: 401, ok: false, json: async () => ({ message: 'Bad credentials' }) })
    )

    await expect(getFileSha('some/path.md')).rejects.toThrow('401')
  })

  it('throws on a 5xx server error', async () => {
    const { getFileSha } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({ status: 500, ok: false, json: async () => ({ message: 'Server Error' }) })
    )

    await expect(getFileSha('some/path.md')).rejects.toThrow('500')
  })
})

describe('listDirectory', () => {
  it('returns empty array on 404', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(mockResponse({ status: 404, ok: false }))

    await expect(listDirectory('some/path')).resolves.toEqual([])
  })

  it('filters out .gitkeep files', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: '.gitkeep', type: 'file' },
          { name: 'a.md', type: 'file' },
        ])
      })
    )

    await expect(listDirectory('some/path')).resolves.toEqual([{ name: 'a.md', type: 'file' }])
  })

  it('filters out entries where type !== \'file\'', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: 'subdir', type: 'dir' },
          { name: 'a.md', type: 'file' },
        ])
      })
    )

    await expect(listDirectory('some/path')).resolves.toEqual([{ name: 'a.md', type: 'file' }])
  })
})

describe('listDirectory — gitkeep filtering', () => {
  it('filters out entries where name === \'.gitkeep\'', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: '.gitkeep', type: 'file' },
          { name: 'a.md', type: 'file' },
        ])
      })
    )

    const result = await listDirectory('some/path')
    expect(result.some(f => f.name === '.gitkeep')).toBe(false)
  })

  it('filters out entries where type !== \'file\'', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: 'subdir', type: 'dir' },
          { name: 'a.md', type: 'file' },
        ])
      })
    )

    const result = await listDirectory('some/path')
    expect(result.every(f => f.type === 'file')).toBe(true)
  })

  it('returns empty array when GitHub responds with 404', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(mockResponse({ status: 404, ok: false }))

    await expect(listDirectory('some/path')).resolves.toEqual([])
  })

  it('never returns an entry with a data: download_url', async () => {
    const { listDirectory } = await loadGithubApi()

    // GitHub serves tiny files like .gitkeep with a data: download_url
    // (e.g. data:text/plain;base64,Cg==). Such an entry must never survive
    // the filter, because fetch() on a data: URL throws a CORS error.
    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: '.gitkeep', type: 'file', download_url: 'data:text/plain;base64,Cg==' },
          { name: 'a.md', type: 'file', download_url: 'https://raw.githubusercontent.com/acme/repo/main/a.md' },
        ])
      })
    )

    const result = await listDirectory('some/path')
    expect(result.every(f => !String(f.download_url ?? '').startsWith('data:'))).toBe(true)
  })
})

describe('Issue #20 — .gitkeep data: URL CORS regression', () => {
  // Reproduces the exact console error: "Cross-Origin Request Blocked:
  // data:text/plain;base64,Cg==". GitHub inlines the content of tiny files
  // like .gitkeep directly into the `download_url` field as a data: URL.
  // The fix centralises filtering at the listDirectory boundary so that NO
  // consumer (DirectoryDrawer, useImageCleanup, useEditorSave, …) can ever
  // iterate a directory entry whose download_url is a data: URL and feed it
  // to fetch(). This asserts the consumer-facing safety property directly:
  // every entry listDirectory hands back must be safe to fetch().
  it('strips the .gitkeep entry carrying data:text/plain;base64,Cg== so no consumer can fetch it', async () => {
    const { listDirectory } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          {
            name: '.gitkeep',
            type: 'file',
            path: 'src/content/notes/course1/web/notes/.gitkeep',
            download_url: 'data:text/plain;base64,Cg==',
          },
          {
            name: 'intro.md',
            type: 'file',
            path: 'src/content/notes/course1/web/notes/intro.md',
            download_url: 'https://raw.githubusercontent.com/acme/repo/main/src/content/notes/course1/web/notes/intro.md',
          },
        ])
      })
    )

    const result = await listDirectory('src/content/notes/course1/web/notes')

    // The placeholder must be gone entirely…
    expect(result.some(f => f.name === '.gitkeep')).toBe(false)
    // …and every surviving entry must be safe to hand to fetch() — i.e. no
    // data: URL survives anywhere a consumer could reach it.
    expect(result.every(f => !String(f.download_url ?? '').startsWith('data:'))).toBe(true)
    expect(result).toEqual([
      {
        name: 'intro.md',
        type: 'file',
        path: 'src/content/notes/course1/web/notes/intro.md',
        download_url: 'https://raw.githubusercontent.com/acme/repo/main/src/content/notes/course1/web/notes/intro.md',
      },
    ])
  })
})

describe('commitFileWithRetry', () => {
  it('retries on 409 and succeeds on second attempt', async () => {
    vi.useFakeTimers()
    const { commitFileWithRetry } = await loadGithubApi()

    globalThis.fetch
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: 'sha-1' }) }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 409 }))
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: 'sha-2' }) }))
      .mockResolvedValueOnce(mockResponse({ ok: true, status: 200, json: async () => ({ ok: true }) }))

    const promise = commitFileWithRetry('a/b.md', 'hello', 'msg')
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual({ ok: true })
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)

    vi.useRealTimers()
  })

  it('retries on 422 stale-sha conflict and succeeds on second attempt', async () => {
    vi.useFakeTimers()
    const { commitFileWithRetry } = await loadGithubApi()

    // GitHub's Contents API reports a stale-sha conflict as 422 Unprocessable
    // Entity far more often than 409. This must be retried, not rethrown.
    globalThis.fetch
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: 'sha-1' }) }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 422 }))
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: 'sha-2' }) }))
      .mockResolvedValueOnce(mockResponse({ ok: true, status: 200, json: async () => ({ ok: true }) }))

    const promise = commitFileWithRetry('a/b.md', 'hello', 'msg')
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual({ ok: true })
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)

    vi.useRealTimers()
  })

  it('rethrows immediately on non-409 errors', async () => {
    const { commitFileWithRetry } = await loadGithubApi()

    globalThis.fetch
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: 'sha-1' }) }))
      .mockResolvedValueOnce(mockResponse({ ok: false, status: 500 }))

    await expect(commitFileWithRetry('a/b.md', 'hello', 'msg')).rejects.toThrow('500')
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('uploadImage', () => {
  it('throws with status code on failure', async () => {
    const { uploadImage } = await loadGithubApi()

    globalThis.fetch
      .mockResolvedValueOnce(mockResponse({ json: async () => ({ sha: null }) }))
      .mockResolvedValueOnce(
        mockResponse({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Bad Request' })
        })
      )

    await expect(uploadImage('public/x.png', new ArrayBuffer(2))).rejects.toThrow('400')
  })
})

describe('listAllImages', () => {
  it('returns correct path, githubPath, and rawUrl for each file', async () => {
    const { listAllImages } = await loadGithubApi()

    globalThis.fetch.mockResolvedValueOnce(
      mockResponse({
        json: async () => ([
          { name: '1.png', type: 'file', path: 'public/notes/img/mod/1.png' },
          { name: '.gitkeep', type: 'file', path: 'public/notes/img/mod/.gitkeep' },
          { name: 'subdir', type: 'dir', path: 'public/notes/img/mod/subdir' },
        ])
      })
    )

    await expect(listAllImages('mod')).resolves.toEqual([
      {
        path: '/notes/img/mod/1.png',
        githubPath: 'public/notes/img/mod/1.png',
        rawUrl: 'https://raw.githubusercontent.com/acme/repo/main/public/notes/img/mod/1.png',
      },
    ])
  })
})

