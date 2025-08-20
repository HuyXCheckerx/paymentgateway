import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PaymentProcessor from './components/PaymentProcessor'
import OrderStatus from './components/OrderStatus'
import Admin from './components/Admin'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<PaymentProcessor />} />
          <Route path="/process" element={<PaymentProcessor />} />
          <Route path="/status/:orderId" element={<OrderStatus />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
