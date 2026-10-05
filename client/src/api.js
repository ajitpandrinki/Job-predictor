const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function request(path, options = {}) {
  const token = localStorage.getItem('roleready-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Something went wrong. Please try again.')
  return payload
}
