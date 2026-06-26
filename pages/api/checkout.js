import Stripe from 'stripe'
import { supabaseWithToken, supabaseAdmin } from '../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_MAP = {
  monthly:  process.env.STRIPE_PRICE_MONTHLY,
  yearly:   process.env.STRIPE_PRICE_YEARLY,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' })
  const token = authHeader.split(' ')[1]

  const client = supabaseWithToken(token)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Token invalide' })

  const { plan } = req.body
  const priceId = PRICE_MAP[plan]
  if (!priceId) return res.status(400).json({ error: 'Plan invalide' })

  try {
    const admin = supabaseAdmin()
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const isLifetime = plan === 'lifetime'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: isLifetime ? 'payment' : 'subscription',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/simulateur?success=1`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { supabase_user_id: user.id, plan },
      ...(isLifetime ? {} : {
        subscription_data: { metadata: { supabase_user_id: user.id, plan } }
      }),
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('Stripe error:', e)
    return res.status(500).json({ error: e.message })
  }
}
