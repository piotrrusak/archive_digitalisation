import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/loginForm'
import Home from './components/Home'

function App() {
  const isLoggedIn = sessionStorage.getItem("authToken") // rewrite to context

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
