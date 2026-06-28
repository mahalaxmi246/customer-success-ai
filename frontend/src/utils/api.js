import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Customers ─────────────────────────────────────────────
export const getCustomers = () =>
  api.get('/customers').then(r => r.data)

export const getCustomerHistory = (id) =>
  api.get(`/customers/${id}/history`).then(r => r.data)

// ── Interactions ──────────────────────────────────────────
export const getInteractions = (params = {}) =>
  api.get('/interactions', { params }).then(r => r.data)

export const getInteraction = (id) =>
  api.get(`/interactions/${id}`).then(r => r.data)

export const createManualInteraction = (data) =>
  api.post('/interactions/manual', data).then(r => r.data)

export const analyzeInteraction = (id) =>
  api.post(`/interactions/${id}/analyze`).then(r => r.data)

export const approveInteraction = (id, approvals) =>
  api.post(`/interactions/${id}/approve`, { approvals }).then(r => r.data)

export default api