// src/App.jsx
// FIX #15: ToastProvider wraps the entire app
import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import ErrorBoundary from './pages/ErrorBoundary'
import { ToastProvider } from './components/Toast'

const AuthPage        = lazy(() => import('./pages/AuthPage'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const CustomerShop    = lazy(() => import('./pages/CustomerShop'))
const DeliveryPage    = lazy(() => import('./pages/DeliveryPage'))
const BranchDashboard = lazy(() => import('./pages/BranchDashboard'))
const VendorPortal    = lazy(() => import('./pages/VendorPortal'))

function Loading() {
  return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#F4F6F3' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:64,height:64,borderRadius:16,background:'#3B6D11',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px',boxShadow:'0 4px 14px rgba(59,109,17,0.35)' }}>🌾</div>
        <p style={{ color:'#3B6D11',fontWeight:700,fontSize:16,margin:'0 0 6px' }}>Green Village Rice</p>
        <p style={{ color:'#6B7280',fontSize:13,margin:'0 0 20px' }}>గ్రీన్ విలేజ్ రైస్</p>
        <div style={{ display:'flex',gap:6,justifyContent:'center' }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8,height:8,borderRadius:'50%',background:'#3B6D11',animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRouter() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)   return <Navigate to="/login" replace />
  if (user.role==='delivery')         return <Navigate to="/delivery" replace />
  if (user.role==='customer')         return <Navigate to="/shop"     replace />
  if (user.role==='branch_executive') return <Navigate to="/branch"   replace />
  if (user.role==='vendor')           return <Navigate to="/vendor"   replace />
  return <Navigate to="/dashboard" replace />
}

function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) {
    if (user.role==='customer')         return <Navigate to="/shop"      replace />
    if (user.role==='delivery')         return <Navigate to="/delivery"  replace />
    if (user.role==='branch_executive') return <Navigate to="/branch"    replace />
    if (user.role==='vendor')           return <Navigate to="/vendor"    replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  const { init } = useAuth()
  useEffect(() => { init() }, [])

  return (
    <ErrorBoundary>
      {/* FIX #15: ToastProvider wraps all routes so any page can use useToast() */}
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login"       element={<AuthGuard><AuthPage /></AuthGuard>} />
              <Route path="/signup"      element={<AuthGuard><AuthPage defaultMode="signup" /></AuthGuard>} />
              <Route path="/"            element={<RoleRouter />} />
              <Route path="/dashboard/*" element={<Protected roles={['superadmin','admin']}><Dashboard /></Protected>} />
              <Route path="/shop"        element={<Protected><CustomerShop /></Protected>} />
              <Route path="/delivery"    element={<Protected roles={['delivery','superadmin','admin']}><DeliveryPage /></Protected>} />
              <Route path="/branch/*"    element={<Protected roles={['branch_executive','superadmin','admin']}><BranchDashboard /></Protected>} />
              <Route path="/vendor/*"    element={<Protected roles={['vendor','superadmin','admin']}><VendorPortal /></Protected>} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
