import { useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('authToken'))

  const [userId, setUserId] = useState<number | null>(() => {
    const storedId = sessionStorage.getItem('authUserId')
    return storedId ? Number(storedId) : null
  })

  const [userEmail, setUserEmail] = useState<string | null>(sessionStorage.getItem('authUserEmail'))

  const login = (newToken: string, newUserId: number, newUserEmail: string) => {
    sessionStorage.setItem('authToken', newToken)
    sessionStorage.setItem('authUserId', String(newUserId))
    sessionStorage.setItem('authUserEmail', newUserEmail)

    setToken(newToken)
    setUserId(newUserId)
    setUserEmail(newUserEmail)
  }

  const logout = () => {
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authUserId')
    sessionStorage.removeItem('authUserEmail')

    setToken(null)
    setUserId(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        userEmail,
        isLoggedIn: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
