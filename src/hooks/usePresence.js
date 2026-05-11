import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

console.log('[Presence] Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('[Presence] Anon key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

// Test basic connection
supabase.from('sessions').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('[Presence] Supabase connection failed:', error.message)
    } else {
      console.log('[Presence] Supabase connected. Sessions count:', count)
    }
  })

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState(1)

  useEffect(() => {
    // Get or create session ID
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('session_id', sessionId)
    }

    // Open one WebSocket channel — stays open until browser closes
    const channel = supabase.channel('online-users', {
      config: { presence: { key: sessionId } }
    })

    // When presence state changes, recount
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      setOnlineCount(Object.keys(state).length)
    })

    // Subscribe and track this user
    channel.subscribe(async (status) => {
      console.log('[Presence] Channel status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('[Presence] Tracking session:', sessionId)
        
        // Ensure session exists in sessions table
        await supabase
          .from('sessions')
          .upsert({ id: sessionId, last_seen: new Date().toISOString() })
        
        await channel.track({ session_id: sessionId, online_at: new Date().toISOString() })
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Presence] Channel error — check Supabase Realtime is enabled')
      }
      if (status === 'TIMED_OUT') {
        console.error('[Presence] Channel timed out')
      }
    })

    // Cleanup — unsubscribe when component unmounts
    // Supabase automatically removes user from presence on disconnect
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { onlineCount }
}
