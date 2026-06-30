import { createClient } from '@supabase/supabase-js'

let _supabase = null
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Garde l'export "supabase" pour compat avec le code existant,
// mais en proxy paresseux : ne crée le client qu'au premier accès réel.
export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getSupabase()[prop]
  }
})

export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin env vars missing')
  }
  return createClient(url, key)
}

export const supabaseWithToken = (token) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars missing')
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}