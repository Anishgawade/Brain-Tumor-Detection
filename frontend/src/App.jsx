import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import History from './pages/History'
import Patients from './pages/Patients'
import About from './pages/About'
import Home from './pages/Home'
import Login from './pages/Login'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="app-layout" style={{ '--sidebar-width': sidebarOpen ? '240px' : '72px' }}>
          <Sidebar theme={theme} toggleTheme={toggleTheme} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
              <Route path="/analyze" element={<PrivateRoute><Analyze /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
