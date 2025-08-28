import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PaymentProcessor from './components/PaymentProcessor'
import OrderStatus from './components/OrderStatus'
import Admin from './components/Admin'
import AccessGuard from './components/AccessGuard'
import PrismaticBurst from './PrismaticBurst'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background relative">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <PrismaticBurst
            animationType="rotate3d"
            intensity={2}
            speed={0.5}
            distort={1.0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={24}
            mixBlendMode="lighten"
            colors={['#ff007a', '#4d3dff', '#ffffff']}
          />
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
