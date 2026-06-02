/**
 * Fichier : pages/admin.js
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'

const T = {
  bg: '#05080f', s1: '#0e1520', s2: '#141d2e', border: '#1e2d45',
  gold: '#c9a84c', text: '#e8f0fa', textDim: '#7a93b0', green: '#2ecc71',
  red: '#e74c3c'
}

export default function AdminDashboard() {
  const router = useRouter()
  const { getToken, user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const fetchUsers = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(`Erreur ${res.status} : ${data.error || 'Droits insuffisants'}`)
        setLoading(false)
        return
      }
      setUsers(data.users || [])
    } catch (e) {
      setMsg('Erreur réseau : ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) fetchUsers() }, [user])

  const updateUser = async (userId, plan, role) => {
    setMsg('Mise à jour...')
    const token = await getToken()
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, plan, role })
    })
    const data = await res.json()
    if (res.ok) {
      setMsg('✓ Modifié avec succès !')
      fetchUsers()
    } else {
      setMsg(`Erreur ${res.status} : ${data.error}`)
    }
  }

  if (loading) return (
    <div style={{ background: T.bg, color: T.text, padding: 40, minHeight: '100vh' }}>
      Chargement de l'administration...
    </div>
  )

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', padding: 40, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ color: T.gold, fontSize: 24 }}>🔧 Backoffice Administrateur — AuditImmo</h1>
        <button onClick={() => router.push('/simulateur')} style={{ background: T.s2, border: `1px solid ${T.border}`, color: T.text, padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Retour au Simulateur</button>
      </div>

      {msg && (
        <div style={{ background: T.s2, color: msg.startsWith('✓') ? T.green : T.red, padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14, border: `1px solid ${msg.startsWith('✓') ? T.green : T.red}44` }}>
          {msg}
        </div>
      )}

      {users.length === 0 && !msg && (
        <div style={{ color: T.textDim, padding: 20 }}>Aucun utilisateur trouvé.</div>
      )}

      {users.length > 0 && (
        <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: T.s2, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: 14, color: T.textDim }}>Email</th>
                <th style={{ padding: 14, color: T.textDim }}>Plan</th>
                <th style={{ padding: 14, color: T.textDim }}>Fin d'essai</th>
                <th style={{ padding: 14, color: T.textDim }}>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 14 }}>{u.email}</td>
                  <td style={{ padding: 14 }}>
                    <select value={u.plan} onChange={(e) => updateUser(u.id, e.target.value, u.role)}
                      style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, padding: 6, borderRadius: 4 }}>
                      <option value="trial">Free Trial</option>
                      <option value="free">Free (Bridé)</option>
                      <option value="premium_month">Premium Mensuel</option>
                      <option value="premium_year">Premium Annuel</option>
                      <option value="premium_life">Premium À Vie</option>
                    </select>
                  </td>
                  <td style={{ padding: 14, color: T.textDim, fontSize: 13 }}>
                    {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: 14, color: T.textDim, fontSize: 13 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
