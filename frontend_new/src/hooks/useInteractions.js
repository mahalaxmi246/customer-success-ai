import { useState, useEffect, useCallback } from 'react'
import { getInteractions } from '../utils/api'

export function useInteractions(params = {}, pollInterval = 5000) {
  const [interactions, setInteractions] = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const fetch = useCallback(async () => {
    try {
      const data = await getInteractions(params)
      setInteractions(data.interactions || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetch()
    if (pollInterval) {
      const interval = setInterval(fetch, pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetch, pollInterval])

  return { interactions, total, loading, error, refetch: fetch }
}