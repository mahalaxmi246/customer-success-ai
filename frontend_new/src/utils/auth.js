const AUTH_KEY = 'pulsecs_user'

export function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return !!getUser()
}

export function login(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CS'
}
