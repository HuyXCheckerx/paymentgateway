import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PaymentProcessor from './components/PaymentProcessor'
import OrderStatus from './components/OrderStatus'
import Admin from './components/Admin'
import AccessGuard from './components/AccessGuard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 z-0 opacity-5">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
            <Route path="/process" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
            <Route path="/status/:orderId" element={<OrderStatus />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
