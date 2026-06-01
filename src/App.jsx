import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
        <p style={{ color: '#3B6D11', fontWeight: 600 }}>Loading...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { init } = useAuth()
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/*" element={<Protected><Dashboard /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}
