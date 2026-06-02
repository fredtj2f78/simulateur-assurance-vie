import Stripe from 'stripe'
import { supabaseAdmin } from '../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const PLAN_MAP = {
  monthly: 'premium_month',
  yearly: 'premium_year',
  lifetime: 'premium_life',
}

async function setUserPlan(admin, userId, plan, subscriptionId = null) {
  const update = { plan }
  if (subscriptionId !== undefined) update.stripe_subscription_id = subscriptionId
  const { error } = await admin.from('profiles').update(update).eq('id', userId)
  if (error) console.error(`❌ Supabase update error for ${userId}:`, error)
  else console.log(`✅ Plan mis à jour → ${plan} pour user ${userId}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    console.error('❌ Webhook signature invalide:', e.message)
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  const admin = supabaseAdmin()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const planRaw = session.metadata?.plan
        if (!userId) { console.error('❌ Missing supabase_user_id'); break }

        const plan = PLAN_MAP[planRaw] ?? 'premium_month'

        if (planRaw === 'lifetime') {
          await setUserPlan(admin, userId, 'premium_life', null)
        } else {
          await setUserPlan(admin, userId, plan, session.subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break
        const planRaw = sub.metadata?.plan
        const plan = PLAN_MAP[planRaw] ?? 'premium_month'
        const isActive = ['active', 'trialing'].includes(sub.status)
        await setUserPlan(admin, userId, isActive ? plan : 'free', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = sub.metadata?.supabase_user_id
        if (!userId) break
        await setUserPlan(admin, userId, 'free', null)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const { data: profile } = await admin
          .from('profiles').select('id')
          .eq('stripe_customer_id', invoice.customer).single()
        if (profile) console.warn(`⚠️ Échec paiement user ${profile.id}`)
        break
      }

      default:
        console.log(`ℹ️ Event ignoré: ${event.type}`)
    }
  } catch (e) {
    console.error('❌ Erreur webhook:', e)
    return res.status(500).json({ error: 'Erreur interne' })
  }

  return res.status(200).json({ received: true })
}
