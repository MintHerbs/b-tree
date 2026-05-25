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

