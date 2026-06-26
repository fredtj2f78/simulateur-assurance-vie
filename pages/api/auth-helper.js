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

  const { data } = await admin
    .from('profiles')
    .select('plan, trial_ends_at, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('id', userId)
    .single()

  if (data) {
    // Si pas de trial_ends_at défini → on calcule created_at + 7 jours
    if (!data.trial_ends_at && data.created_at) {
      const trialEnd = new Date(data.created_at)
      trialEnd.setDate(trialEnd.getDate() + 7)
      data.trial_ends_at = trialEnd.toISOString()
      data.plan = data.plan || 'trial'
    }
    return data
  }

  // Fallback par email via auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  if (authUser?.user?.email) {
    const { data: data2 } = await admin
      .from('profiles')
      .select('plan, trial_ends_at, stripe_customer_id, stripe_subscription_id, created_at')
      .eq('email', authUser.user.email)
      .single()

    if (data2) {
      if (!data2.trial_ends_at && data2.created_at) {
        const trialEnd = new Date(data2.created_at)
        trialEnd.setDate(trialEnd.getDate() + 7)
        data2.trial_ends_at = trialEnd.toISOString()
        data2.plan = data2.plan || 'trial'
      }
      return data2
    }
  }

  // Fallback ultime : free sans essai
  return { plan: 'free' }
}

export function checkAccess(profile) {
  const now = new Date()
  const hasPremiumPlan = ['premium_month', 'premium_year', 'premium_life', 'premium_lifetime'].includes(profile?.plan)
  const isTrialActive = profile?.trial_ends_at && new Date(profile.trial_ends_at) > now
  const isAdmin = profile?.role === 'admin'

  return {
    isPremium: hasPremiumPlan,
    isTrial: isTrialActive,
    isAdmin,
    hasFullAccess: hasPremiumPlan || isTrialActive || isAdmin
  }
}