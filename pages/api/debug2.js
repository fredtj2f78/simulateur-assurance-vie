import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, plan')
    .limit(5)
  return res.status(200).json({ data, error })
}
