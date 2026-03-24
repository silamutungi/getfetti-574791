import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-mono flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="font-serif text-4xl text-ink">Page not found</h1>
                <p className="text-dim">That page doesn't exist.</p>
                <a href="/" className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] flex items-center">Go home</a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
