import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PaymentProcessor from './components/PaymentProcessor'
import OrderStatus from './components/OrderStatus'
import Admin from './components/Admin'
import AccessGuard from './components/AccessGuard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
          <Route path="/process" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
          <Route path="/status/:orderId" element={<OrderStatus />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<AccessGuard><PaymentProcessor /></AccessGuard>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
