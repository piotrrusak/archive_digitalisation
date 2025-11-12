// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { useAuth } from './hooks/useAuth'
import Register from './pages/Register'
import Login from './pages/Login'
import Account from './pages/Accounts'
import Scan from './pages/Scan'
import Documents from './pages/Documents'
import Admin from './pages/Admin'
import { GoogleCallback } from './pages/GoogleCallback'
import DocumentView from './pages/DocumentView'

function App() {
  const isLoggedIn = useAuth().isLoggedIn

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/documents"
          element={isLoggedIn ? <Documents /> : <Navigate to="/login" />}
        />{' '}
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<Login />} />
        <Route path="/scan" element={isLoggedIn ? <Scan /> : <Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/document/:id"
          element={isLoggedIn ? <DocumentView /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
