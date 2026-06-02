import { useState } from 'react'
import { useRouter } from 'next/router'

const G = {
  bg: '#05080f',
  s1: '#0b1120',
  s2: '#101828',
  border: '#1a2740',
  gold: '#c9a84c',
  goldLight: '#e8c76a',
  blue: '#3b82f6',
  text: '#f0f6ff',
  textDim: '#8ba3c7',
  textMuted: '#3d5470',
}

export default function ContactPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ nom: '', email: '', sujet: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputStyle = {
    width: '100%', background: G.s2, border: `1px solid ${G.border}`,
    borderRadius: 10, padding: '12px 14px', color: G.text, fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = { display: 'block', color: G.textDim, fontSize: 13, marginBottom: 6, fontWeight: 500 }

  return (
    <div style={{ minHeight: '100vh', background: G.bg, color: G.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ padding: '0 40px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${G.border}` }}>
        <span onClick={() => router.push('/')} style={{ cursor: 'pointer', fontWeight: 800, fontSize: 18, background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SimuImmo
        </span>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 8, color: G.textDim, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
          ← Retour
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px' }}>Nous contacter</h1>
          <p style={{ color: G.textDim, fontSize: 15, margin: 0 }}>Une question ou un feedback sur SimuImmo ? Écrivez-nous.</p>
        </div>

        {status === 'success' ? (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#10b981', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Message envoyé !</p>
            <p style={{ color: G.textDim, fontSize: 14, margin: '0 0 24px' }}>Nous vous répondrons rapidement.</p>
            <button onClick={() => setStatus('idle')} style={{ background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 8, color: G.textDim, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <div style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 16, padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input name="nom" value={form.nom} onChange={handleChange} placeholder="Jean Dupont" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jean@exemple.fr" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Sujet</label>
              <select name="sujet" value={form.sujet} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Choisir un sujet…</option>
                <option value="Feedback général">Feedback général</option>
                <option value="Bug / Problème technique">Bug / Problème technique</option>
                <option value="Question sur le simulateur">Question sur le simulateur</option>
                <option value="Demande de fonctionnalité">Demande de fonctionnalité</option>
                <option value="Facturation / Licence">Facturation / Licence</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                placeholder="Décrivez votre demande…"
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
            </div>

            {status === 'error' && (
              <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>Une erreur est survenue. Réessayez.</p>
            )}

            <button onClick={handleSubmit}
              disabled={status === 'loading' || !form.nom || !form.email || !form.sujet || !form.message}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15, transition: 'opacity 0.2s',
                background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
                color: '#000', opacity: (status === 'loading' || !form.nom || !form.email || !form.sujet || !form.message) ? 0.5 : 1,
              }}>
              {status === 'loading' ? 'Envoi en cours…' : 'Envoyer le message →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
