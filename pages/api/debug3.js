import { supabaseWithToken, supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(200).json({ error: 'Pas de token' })
  
  const token = authHeader.split(' ')[1]
  const client = supabaseWithToken(token)
  const { data: { user }, error } = await client.auth.getUser()
  
  if (!user) return res.status(200).json({ error, user: null })
  
  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return res.status(200).json({ user_id: user.id, email: user.email, profile })
}
