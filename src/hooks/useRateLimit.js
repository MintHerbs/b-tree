import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ACTION_CONFIG = {
  post: {
    max: 5,
    windowMs: 60 * 60 * 1000,
    countField: 'post_count',
    windowField: 'post_window_start',
  },
  comment: {
    max: 10,
    windowMs: 60 * 60 * 1000,
    countField: 'comment_count',
    windowField: 'comment_window_start',
  },
  vote: {
    max: 50,
    windowMs: 60 * 60 * 1000,
    countField: 'vote_count',
    windowField: 'vote_window_start',
  },
}

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

function buildDefaults(sessionId, nowIso) {
  return {
    session_id: sessionId,
    post_count: 0,
    post_window_start: nowIso,
    comment_count: 0,
    comment_window_start: nowIso,
    vote_count: 0,
    vote_window_start: nowIso,
  }
}

export function useRateLimit() {
  const [sessionId, setSessionId] = useState(null)
  const [isBlacklisted, setIsBlacklisted] = useState(false)

  const checkAndIncrementPostCount = useCallback(async () => {
    try {
      if (!sessionId) return { allowed: true }

      const now = Date.now()
      const nowIso = new Date().toISOString()
      const windowMs = 60 * 60 * 1000

      const { data: row, error: fetchError } = await supabase
        .from('rate_limits')
        .select('post_count, post_window_start')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (fetchError) {
        console.error('[RateLimit] Failed to fetch post rate limit:', fetchError)
        return { allowed: true }
      }

      if (!row) {
        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert({ session_id: sessionId, post_count: 1, post_window_start: nowIso })
          .select('session_id')
          .maybeSingle()

        if (insertError) console.error('[RateLimit] Failed to insert post rate limit row:', insertError)
        return { allowed: true }
      }

      const windowStartMs = new Date(row.post_window_start).getTime()
      const ageMs = now - windowStartMs

      if (!Number.isFinite(windowStartMs) || ageMs >= windowMs) {
        const { error: resetError } = await supabase
          .from('rate_limits')
          .update({ post_count: 1, post_window_start: nowIso })
          .eq('session_id', sessionId)

        if (resetError) console.error('[RateLimit] Failed to reset post rate limit window:', resetError)
        return { allowed: true }
      }

      const postCount = row.post_count ?? 0

      if (postCount >= 5) {
        const secondsLeft = Math.max(0, Math.ceil((windowMs - ageMs) / 1000))

        if (ageMs < 2 * 60 * 1000) {
          const { error: blacklistError } = await supabase.from('bot_blacklist').upsert({
            session_id: sessionId,
            reason: 'post_burst',
          })
          if (blacklistError) console.error('[RateLimit] Failed to upsert bot blacklist:', blacklistError)
          setIsBlacklisted(true)
        }

        return { allowed: false, secondsLeft }
      }

      const { error: incrementError } = await supabase
        .from('rate_limits')
        .update({ post_count: postCount + 1 })
        .eq('session_id', sessionId)

      if (incrementError) {
        console.error('[RateLimit] Failed to increment post count:', incrementError)
        return { allowed: true }
      }

      return { allowed: true }
    } catch (e) {
      console.error('[RateLimit] Post rate limit check failed:', e)
      return { allowed: true }
    }
  }, [sessionId])

  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)

    const checkBlacklist = async () => {
      const { data, error } = await supabase
        .from('bot_blacklist')
        .select('session_id')
        .eq('session_id', id)
        .maybeSingle()

      if (!error && data?.session_id) setIsBlacklisted(true)
    }

    checkBlacklist()
  }, [])

  const ensureRateLimitRow = useCallback(async () => {
    if (!sessionId) return null

    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (!error && data) return data

    const nowIso = new Date().toISOString()
    const defaults = buildDefaults(sessionId, nowIso)
    const insertRes = await supabase.from('rate_limits').insert(defaults).select('*').maybeSingle()

    if (insertRes.error || !insertRes.data) return null
    return insertRes.data
  }, [sessionId])

  const checkLimit = useCallback(
    async (action) => {
      if (!sessionId) return false

      const cfg = ACTION_CONFIG[action]
      if (!cfg) return true

      if (action === 'post') {
        if (isBlacklisted) return false
        const res = await checkAndIncrementPostCount()
        return !!res.allowed
      }

      let row = await ensureRateLimitRow()
      if (!row) return false

      const now = Date.now()
      const windowStartMs = new Date(row[cfg.windowField]).getTime()
      const windowAgeMs = now - windowStartMs

      if (windowAgeMs >= cfg.windowMs) {
        const nowIso = new Date().toISOString()
        const { data: updated, error: updateError } = await supabase
          .from('rate_limits')
          .update({ [cfg.countField]: 0, [cfg.windowField]: nowIso })
          .eq('session_id', sessionId)
          .select('*')
          .maybeSingle()

        if (updateError || !updated) return false
        row = updated
      }

      const count = row[cfg.countField] ?? 0
      const currentWindowStartMs = new Date(row[cfg.windowField]).getTime()

      if (action === 'post' && count >= cfg.max && now - currentWindowStartMs < 2 * 60 * 1000) {
        await supabase.from('bot_blacklist').upsert({
          session_id: sessionId,
          reason: 'post_burst',
        })
        setIsBlacklisted(true)
        return false
      }

      if (count >= cfg.max) return false
      return true
    },
    [checkAndIncrementPostCount, ensureRateLimitRow, isBlacklisted, sessionId]
  )

  const recordAction = useCallback(
    async (action) => {
      if (!sessionId) return

      if (action === 'post') return

      const cfg = ACTION_CONFIG[action]
      if (!cfg) return

      let row = await ensureRateLimitRow()
      const now = Date.now()
      const nowIso = new Date().toISOString()

      if (!row) {
        const insertRow = buildDefaults(sessionId, nowIso)
        insertRow[cfg.countField] = 1
        insertRow[cfg.windowField] = nowIso
        await supabase.from('rate_limits').insert(insertRow)
        return
      }

      const windowStartMs = new Date(row[cfg.windowField]).getTime()
      const windowAgeMs = now - windowStartMs

      const nextCount = windowAgeMs >= cfg.windowMs ? 1 : (row[cfg.countField] ?? 0) + 1
      const nextWindowStart = windowAgeMs >= cfg.windowMs ? nowIso : row[cfg.windowField]

      await supabase
        .from('rate_limits')
        .update({ [cfg.countField]: nextCount, [cfg.windowField]: nextWindowStart })
        .eq('session_id', sessionId)
    },
    [ensureRateLimitRow, sessionId]
  )

  return useMemo(
    () => ({
      checkLimit,
      recordAction,
      isBlacklisted,
    }),
    [checkLimit, isBlacklisted, recordAction]
  )
}
