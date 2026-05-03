import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '')
const supabase = createClient(
  url,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState(1)

  useEffect(() => {
    // Get or create session ID
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('session_id', sessionId)
    }

    // Ping session function
    const pingSession = async (id) => {
      try {
        await supabase
          .from('sessions')
          .upsert({ id, last_seen: new Date().toISOString() })
      } catch (error) {
        // Handle errors silently
        console.error('Error pinging session:', error)
      }
    }

    // Fetch online count function
    const fetchOnlineCount = async () => {
      try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_seen', twoMinutesAgo)
        setOnlineCount(count ?? 1)
      } catch (error) {
        // Handle errors silently
        console.error('Error fetching online count:', error)
      }
    }

    // Immediately ping and fetch count
    pingSession(sessionId)
    fetchOnlineCount()

    // Set up intervals
    const pingInterval = setInterval(() => pingSession(sessionId), 30000)
    const countInterval = setInterval(() => fetchOnlineCount(), 30000)

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval)
      clearInterval(countInterval)
    }
  }, [])

  return { onlineCount }
}
