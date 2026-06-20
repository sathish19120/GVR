import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk — React + Router
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts chunk — only loaded on dashboard
          'vendor-charts': ['recharts'],
          // Supabase chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // Admin pages — only loaded for admin/superadmin
          'chunk-admin': [
            './src/pages/Dashboard.jsx',
            './src/pages/AdminPage.jsx',
            './src/pages/BatchPage.jsx',
            './src/pages/BranchStockPage.jsx',
            './src/pages/VendorPage.jsx',
            './src/pages/SupplierPage.jsx',
            './src/pages/PickupQueue.jsx',
            './src/pages/BulkOrderForm.jsx',
            './src/pages/WalkInBilling.jsx',
            './src/pages/HomePage.jsx',
          ],
          // Customer pages
          'chunk-customer': [
            './src/pages/CustomerShop.jsx',
          ],
          // Branch + Delivery
          'chunk-branch': [
            './src/pages/BranchDashboard.jsx',
            './src/pages/DeliveryPage.jsx',
          ],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts']
  }
})
