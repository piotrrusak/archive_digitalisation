import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/loginForm'
import Home from './components/Home'
import { useAuth } from './hooks/useAuth'
import RegisterForm from './components/RegisterForm'

function App() {
  const isLoggedIn = useAuth().isLoggedIn

  console.log(isLoggedIn)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? <Home /> : <Navigate to="/login" />
          }
        />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
