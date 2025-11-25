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

  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    const storedIsAdmin = sessionStorage.getItem('authIsAdmin')
    return storedIsAdmin === null ? null : storedIsAdmin === 'true'
  })

  const login = (
    newToken: string,
    newUserId: number,
    newUserEmail: string,
    newIsAdmin: boolean,
  ) => {
    sessionStorage.setItem('authToken', newToken)
    sessionStorage.setItem('authUserId', String(newUserId))
    sessionStorage.setItem('authUserEmail', newUserEmail)
    sessionStorage.setItem('authIsAdmin', String(newIsAdmin))

    setToken(newToken)
    setUserId(newUserId)
    setUserEmail(newUserEmail)
    setIsAdmin(newIsAdmin)
  }

  const logout = () => {
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authUserId')
    sessionStorage.removeItem('authUserEmail')
    sessionStorage.removeItem('authIsAdmin')

    setToken(null)
    setUserId(null)
    setUserEmail(null)
    setIsAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        userEmail,
        isAdmin,
        isLoggedIn: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
