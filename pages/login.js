import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase' // Import indispensable pour communiquer avec Supabase

const T = {
  bg: '#080c12', s1: '#0e1520', s2: '#141d2e', s3: '#1a2540',
  border: '#1e2d45', gold: '#c9a84c', goldDim: '#7a6030',
  blue: '#4a9eff', green: '#2ecc71', red: '#e74c3c',
  text: '#dce8f5', textDim: '#7a93b0', textMuted: '#3a5070',
}

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    if (!email || (mode !== 'forgot' && !password)) return setError('Veuillez remplir tous les champs')
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push('/simulateur')
      } else if (mode === 'register') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
      } else if (mode === 'forgot') {
        // Logique de réinitialisation
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccess('Un e-mail de récupération a été envoyé sur votre boîte mail.')
      }
    } catch (e) {
      setError(e.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${T.gold}, #e8c76a)`, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>⌂</div>
          <h1 style={{ color: T.text, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>SimuImmov</h1>
          <p style={{ color: T.textDim, fontSize: 14, marginTop: 6 }}>Simulateur fiscal immobilier professionnel</p>
        </div>

        {/* Card */}
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32 }}>
          
          {/* Menu d'onglets (Masqué si on est en mode "Mot de passe oublié") */}
          {mode !== 'forgot' ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              {[['login', 'Connexion'], ['register', 'Créer un compte']].map(([m, lbl]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${mode === m ? T.gold : T.border}`, background: mode === m ? `${T.gold}22` : T.s2, color: mode === m ? T.gold : T.textDim, transition: 'all 0.15s' }}>
                  {lbl}
                </button>
              ))}
            </div>
          ) : (
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Récupération du compte</h2>
          )}

          {/* Champ Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: T.s3, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
          </div>

          {/* Champ Mot de passe (Masqué si mode récupération) */}
          {mode !== 'forgot' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', background: T.s3, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
            </div>
          )}

          {/* Lien Mot de passe oublié (Uniquement visible en mode Connexion) */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <span onClick={() => { setMode('forgot'); setError(''); setSuccess('') }} style={{ color: T.textDim, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                Mot de passe oublié ?
              </span>
            </div>
          )}

          {/* Ajustement des marges en mode Register */}
          {mode === 'register' && <div style={{ marginBottom: 24 }}></div>}
                                                
          {error && <div style={{ background: `${T.red}18`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '10px 14px', color: T.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: `${T.green}18`, border: `1px solid ${T.green}44`, borderRadius: 8, padding: '10px 14px', color: T.green, fontSize: 13, marginBottom: 16 }}>{success}</div>}

          {/* Bouton d'action principal */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', background: `linear-gradient(135deg, ${T.gold}, #e8c76a)`, border: 'none', borderRadius: 8, color: '#000', padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : 'Envoyer le lien'}
          </button>

          {/* Liens de retour et bascule de modes */}
          {mode === 'login' && (
            <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 12, marginTop: 16 }}>
              Pas encore de compte ?{' '}
              <span onClick={() => setMode('register')} style={{ color: T.gold, cursor: 'pointer' }}>7 jours gratuits</span>
            </p>
          )}

          {mode === 'forgot' && (
            <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 12, marginTop: 16 }}>
              <span onClick={() => { setMode('login'); setError(''); setSuccess('') }} style={{ color: T.gold, cursor: 'pointer' }}>
                Retour à la connexion
              </span>
            </p>
          )}
        </div>

        {/* Trial info */}
        {mode === 'register' && (
          <div style={{ marginTop: 20, background: `${T.gold}0e`, border: `1px solid ${T.goldDim}`, borderRadius: 10, padding: '14px 18px', fontSize: 13, color: T.gold, textAlign: 'center' }}>
            🎁 <strong>7 jours d'essai gratuit</strong> — Accès complet sans carte bancaire
          </div>
        )}
      </div>
    </div>
  )
}

