import { supabase } from './supabaseClient'

export async function getAdminProfile(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
