import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#080c12', s1: '#0e1520', s3: '#1a2540', border: '#1e2d45',
  gold: '#c9a84c', text: '#dce8f5', textDim: '#7a93b0',
  green: '#2ecc71', red: '#e74c3c',
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleUpdatePassword = async () => {
    if (!password || password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères')
    }
    setLoading(true); setError(''); setSuccess('')
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      setSuccess('Mot de passe mis à jour avec succès !')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (e) {
      setError(e.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32 }}>
          <h2 style={{ color: T.text, fontSize: 18, fontWight: 700, marginBottom: 8, textAlign: 'center' }}>Nouveau mot de passe</h2>
          <p style={{ color: T.textDim, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>Saisissez votre nouveau mot de passe d'accès.</p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: T.textDim, fontSize: 12, display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()}
              style={{ width: '100%', background: T.s3, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
          </div>

          {error && <div style={{ background: `${T.red}18`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '10px 14px', color: T.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: `${T.green}18`, border: `1px solid ${T.green}44`, borderRadius: 8, padding: '10px 14px', color: T.green, fontSize: 13, marginBottom: 16 }}>{success}</div>}

          <button onClick={handleUpdatePassword} disabled={loading}
            style={{ width: '100%', background: `linear-gradient(135deg, ${T.gold}, #e8c76a)`, border: 'none', borderRadius: 8, color: '#000', padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enregistrement...' : 'Valider le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  )
}
