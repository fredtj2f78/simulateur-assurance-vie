export default function handler(req, res) {
  return res.status(200).json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
    service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
  })
}
