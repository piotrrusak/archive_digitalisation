import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import { useAuth } from './hooks/useAuth'
import RegisterForm from './components/RegisterForm'
import Login from './pages/Login'

function App() {
  const isLoggedIn = useAuth().isLoggedIn

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
