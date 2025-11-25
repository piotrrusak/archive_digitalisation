import { createContext } from 'react'
interface AuthContextType {
  token: string | null
  userId: number | null
  userEmail: string | null
  isAdmin: boolean | null
  isLoggedIn: boolean
  login: (token: string, userId: number, userEmail: string, is_admin: boolean) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
