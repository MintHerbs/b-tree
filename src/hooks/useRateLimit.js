import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ACTION_CONFIG = {
  post: {
    max: 50,
    windowSecs: 3600,
  },
  comment: {
    max: 10,
    windowSecs: 3600,
  },
  chat: {
    max: 20,
    windowSecs: 300,
  },
  vote: {
    max: 50,
    windowSecs: 3600,
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

export function useRateLimit() {
  const [sessionId, setSessionId] = useState(null)
  const [isBlacklisted, setIsBlacklisted] = useState(false)

  const checkAndIncrementPostCount = useCallback(async () => {
    try {
      if (!sessionId) return { allowed: true }

      const cfg = ACTION_CONFIG.post
      const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
        p_session_id: sessionId,
        p_action: 'post',
        p_max_count: cfg.max,
        p_window_secs: cfg.windowSecs,
      })

      if (error) {
        console.error('[RateLimit] Failed to check post rate limit:', error)
        return { allowed: true }
      }

      if (!data.allowed) {
        const secondsLeft = data.retry_after_seconds ?? 0

        // Blacklist if burst posting (within 2 minutes)
        if (secondsLeft > cfg.windowSecs - 2 * 60) {
          const { error: blacklistError } = await supabase.from('bot_blacklist').upsert({
            session_id: sessionId,
            reason: 'post_burst',
          })
          if (blacklistError) console.error('[RateLimit] Failed to upsert bot blacklist:', blacklistError)
          setIsBlacklisted(true)
        }

        return { allowed: false, secondsLeft }
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

      // For non-post actions, check without incrementing
      try {
        const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
          p_session_id: sessionId,
          p_action: action,
          p_max_count: cfg.max,
          p_window_secs: cfg.windowSecs,
        })

        if (error) {
          console.error(`[RateLimit] Failed to check ${action} rate limit:`, error)
          return false
        }

        // If not allowed, throw error with retry_after for countdown UI
        if (!data.allowed) {
          const err = new Error(`Rate limit exceeded for ${action}`)
          err.retryAfter = data.retry_after_seconds
          throw err
        }

        return data.allowed
      } catch (e) {
        console.error(`[RateLimit] ${action} rate limit check failed:`, e)
        // Re-throw if it has retryAfter (our custom error)
        if (e.retryAfter !== undefined) throw e
        return false
      }
    },
    [checkAndIncrementPostCount, isBlacklisted, sessionId]
  )

  const recordAction = useCallback(
    async (action) => {
      if (!sessionId) return

      // Post action is already recorded in checkAndIncrementPostCount
      if (action === 'post') return

      const cfg = ACTION_CONFIG[action]
      if (!cfg) return

      try {
        const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
          p_session_id: sessionId,
          p_action: action,
          p_max_count: cfg.max,
          p_window_secs: cfg.windowSecs,
        })

        if (error) {
          console.error(`[RateLimit] Failed to record ${action}:`, error)
          return
        }

        // If not allowed, throw error with retry_after for countdown UI
        if (!data.allowed) {
          const err = new Error(`Rate limit exceeded for ${action}`)
          err.retryAfter = data.retry_after_seconds
          throw err
        }
      } catch (e) {
        console.error(`[RateLimit] Failed to record ${action}:`, e)
        // Re-throw if it has retryAfter (our custom error)
        if (e.retryAfter !== undefined) throw e
      }
    },
    [sessionId]
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
