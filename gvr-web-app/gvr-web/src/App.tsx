import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import OTPPage from '@/pages/OTPPage'
import OwnerLayout from '@/components/layout/OwnerLayout'
import CustomerLayout from '@/components/layout/CustomerLayout'
import DeliveryLayout from '@/components/layout/DeliveryLayout'
import DashboardPage from '@/pages/owner/DashboardPage'
import OrdersPage from '@/pages/owner/OrdersPage'
import InventoryPage from '@/pages/owner/InventoryPage'
import CustomersPage from '@/pages/owner/CustomersPage'
import AnalyticsPage from '@/pages/owner/AnalyticsPage'
import ShopPage from '@/pages/customer/ShopPage'
import MyOrdersPage from '@/pages/customer/MyOrdersPage'
import ProfilePage from '@/pages/customer/ProfilePage'
import DeliveryHomePage from '@/pages/delivery/DeliveryHomePage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'owner') return <Navigate to="/owner" replace />
  if (user.role === 'delivery') return <Navigate to="/delivery" replace />
  return <Navigate to="/shop" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Owner */}
        <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Customer */}
        <Route path="/shop" element={<ProtectedRoute role="customer"><CustomerLayout /></ProtectedRoute>}>
          <Route index element={<ShopPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Delivery */}
        <Route path="/delivery" element={<ProtectedRoute role="delivery"><DeliveryLayout /></ProtectedRoute>}>
          <Route index element={<DeliveryHomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
