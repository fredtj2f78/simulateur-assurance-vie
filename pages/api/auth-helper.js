import { supabaseWithToken, supabaseAdmin } from '../../lib/supabase'

export async function verifyAuth(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Non authentifié' }
  }
  const token = authHeader.split(' ')[1]
  try {
    const client = supabaseWithToken(token)
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) return { user: null, error: 'Token invalide' }
    return { user, error: null, token }
  } catch (e) {
    return { user: null, error: e.message }
  }
}

export async function getUserProfile(userId) {
  const admin = supabaseAdmin()
  // Essai par id
  const { data, error } = await admin
    .from('profiles')
    .select('plan, trial_ends_at, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single()
  if (data) return data
  // Fallback par email via auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  if (authUser?.user?.email) {
    const { data: data2 } = await admin
      .from('profiles')
      .select('plan, trial_ends_at, stripe_customer_id, stripe_subscription_id')
      .eq('email', authUser.user.email)
      .single()
    if (data2) return data2
  }
  // Fallback : retourne premium_month par défaut si user existe dans auth
  return { plan: 'free' }
}

export function checkAccess(profile) {
  const now = new Date()
  const hasPremiumPlan = ['premium_month','premium_year','premium_life','premium_lifetime'].includes(profile?.plan)
  const isTrialActive = profile?.plan === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) > now
  const isAdmin = profile?.role === 'admin'
  return {
    isPremium: hasPremiumPlan,
    isTrial: isTrialActive,
    isAdmin,
    hasFullAccess: hasPremiumPlan || isTrialActive || isAdmin
  }
}
