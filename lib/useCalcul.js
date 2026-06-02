import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export function useCalcul() {
  const { getToken } = useAuth()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculate = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      
      // Sécurité : Si le token est vide, on bloque avant d'appeler l'API
      if (!token) {
        throw new Error("Utilisateur non authentifié (Token manquant)")
      }

      const res = await fetch('/api/calcul', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur serveur')
      }
      
      const data = await res.json()
      setResult(data)
      return data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { result, loading, error, calculate }
}
