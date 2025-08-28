import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Account from './pages/Accounts'
import Scan from './pages/Scan'

function App() {
  const isLoggedIn = useAuth().isLoggedIn

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
        <Route path="/account" element={<Account />} />
        <Route path="/login" element={<Login />} />
        <Route path="/scan" element={isLoggedIn ? <Scan /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
