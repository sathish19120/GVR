import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import CustomerShop from './pages/CustomerShop'
import DeliveryPage from './pages/DeliveryPage'

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🌾</div>
        <p style={{ color:'#3B6D11', fontWeight:600 }}>Loading...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRouter() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'delivery') return <Navigate to="/delivery" replace />
  if (user.role === 'customer') return <Navigate to="/shop" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const { init } = useAuth()
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<RoleRouter />} />
        <Route path="/dashboard/*" element={<Protected roles={['superadmin','admin']}><Dashboard /></Protected>} />
        <Route path="/shop" element={<Protected><CustomerShop /></Protected>} />
        <Route path="/delivery" element={<Protected roles={['delivery','superadmin','admin']}><DeliveryPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
