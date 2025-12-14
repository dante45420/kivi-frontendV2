import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getToken, verifyToken, clearToken } from './api/auth'

// Layout
import Navbar from './components/Navbar'

// Páginas admin
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Orders from './pages/Orders'
import Shopping from './pages/Shopping'
import Customers from './pages/Customers'
import Sellers from './pages/Sellers'
import Accounting from './pages/Accounting'
import KPIs from './pages/KPIs'
import WeeklyOffers from './pages/WeeklyOffers'
import KiviTips from './pages/KiviTips'
import Login from './pages/Login'

// Páginas públicas
import Home from './pages/public/Home'
import CatalogV3 from './pages/public/CatalogV3'
import About from './pages/public/About'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    const token = getToken()
    if (!token) {
      setIsVerifying(false)
      return
    }
    
    try {
      const result = await verifyToken()
      setIsAuthenticated(result.valid)
    } catch (error) {
      clearToken()
      setIsAuthenticated(false)
    } finally {
      setIsVerifying(false)
    }
  }
  
  const handleLogin = () => {
    setIsAuthenticated(true)
    setIsVerifying(false)
  }
  
  if (isVerifying) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading loading-lg"></div>
        <div style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
          Verificando sesión...
        </div>
      </div>
    )
  }
  
  // Rutas públicas
  const publicRoutes = (
    <>
      <Route path="/" element={<Home />} />
      <Route path="/catalogo" element={<CatalogV3 />} />
      <Route path="/nosotros" element={<About />} />
    </>
  )
  
  // Rutas admin
  const adminRoutes = (
    <>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/productos" element={<Products />} />
      <Route path="/categorias" element={<Categories />} />
      <Route path="/pedidos" element={<Orders />} />
      <Route path="/compras" element={<Shopping />} />
      <Route path="/clientes" element={<Customers />} />
      <Route path="/vendedores" element={<Sellers />} />
      <Route path="/contabilidad" element={<Accounting />} />
      <Route path="/kpis" element={<KPIs />} />
      <Route path="/ofertas" element={<WeeklyOffers />} />
      <Route path="/kivi-tips" element={<KiviTips />} />
    </>
  )
  
  return (
    <div style={{ minHeight: '100vh' }}>
      {isAuthenticated && <Navbar />}
      
      <main style={{ 
        padding: isAuthenticated ? '80px 0 20px' : '0',
        minHeight: '100vh'
      }}>
        <Routes>
          {publicRoutes}
          {isAuthenticated && adminRoutes}
          
          {/* Login */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          } />
          
          {/* Redirect por defecto */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  )
}

