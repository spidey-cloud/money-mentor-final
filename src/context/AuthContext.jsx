import { createContext, useContext, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

const AuthContext = createContext()

// SHA-256 via the Web Crypto API — no library needed.
async function hashPassword(password) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  )
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = readJSON('mm_user', null)
    if (savedUser) setUser(savedUser)
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const storedUsers = readJSON('mm_users', [])
    const hash = await hashPassword(password)
    const foundUser = storedUsers.find(
      u => u.email === email && u.passwordHash === hash
    )
    if (foundUser) {
      const { passwordHash, ...safeUser } = foundUser
      setUser(safeUser)
      writeJSON('mm_user', safeUser)
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const signup = async (userData) => {
    const storedUsers = readJSON('mm_users', [])
    if (storedUsers.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email already registered' }
    }

    const passwordHash = await hashPassword(userData.password)
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      passwordHash,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }

    storedUsers.push(newUser)
    writeJSON('mm_users', storedUsers)

    const { passwordHash: _, ...safeUser } = newUser
    setUser(safeUser)
    writeJSON('mm_user', safeUser)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mm_user')
  }

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    writeJSON('mm_user', updatedUser)

    const storedUsers = readJSON('mm_users', [])
    writeJSON(
      'mm_users',
      storedUsers.map(u => (u.id === user.id ? { ...u, ...updates } : u))
    )
  }

  const sendVerificationEmail = () =>
    new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))

  const verifyEmail = (code) => {
    // Demo only: code is accepted in dev; production must use a real server flow.
    if (!import.meta.env.DEV) {
      return { success: false, error: 'Email verification is not available in this build.' }
    }
    if (code === '123456') {
      updateProfile({ emailVerified: true })
      return { success: true }
    }
    return { success: false, error: 'Invalid verification code' }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      updateProfile,
      sendVerificationEmail,
      verifyEmail,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
