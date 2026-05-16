// Centralized Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrlRaw && supabaseAnonKey)

const supabaseUrl = supabaseUrlRaw
  ? supabaseUrlRaw.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '')
  : null

const createDisabledQuery = () => {
  const result = {
    data: null,
    error: {
      message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.',
    },
  }

  const builder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
    finally: (cb) => Promise.resolve(result).finally(cb),
  }

  return builder
}

const createDisabledChannel = () => {
  const channel = {
    on: () => channel,
    subscribe: (cb) => {
      cb?.('CHANNEL_ERROR')
      return channel
    },
    track: async () => {},
    presenceState: () => ({}),
  }
  return channel
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => createDisabledQuery(),
      channel: () => createDisabledChannel(),
      removeChannel: () => {},
    }

export async function withSession() {
  const sessionId = localStorage.getItem('session_id')
  if (!sessionId) return
  await supabase.rpc('set_session_id', { p_session_id: sessionId })
}
