import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, ChevronRight, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import './Pages.css'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
        toast.success('Successfully logged in')
      } else {
        await signup(email, password)
        toast.success('Account created successfully')
      }
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Failed to authenticate')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle()
      toast.success('Successfully logged in')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Failed to authenticate with Google')
    }
  }

  return (
    <div className="page login-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="glass-card login-card" style={{ 
        maxWidth: 440, 
        width: '100%', 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            background: 'linear-gradient(135deg, var(--primary), var(--cyan))', 
            borderRadius: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)'
          }}>
            <Activity color="white" size={32} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>NeuroScan Clinical</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Secure Doctor Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Medical Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="search-input"
              style={{ width: '100%', paddingLeft: 42, height: 46 }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Secure Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="search-input"
              style={{ width: '100%', paddingLeft: 42, height: 46 }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ height: 46, marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In to Portal' : 'Create Clinical Account')}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
        </div>

        <button 
          onClick={handleGoogle} 
          disabled={loading}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: 18 }} />
          Sign in with Google
        </button>

        <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          {isLogin ? "Don't have an affiliate account?" : "Already registered?"}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, marginLeft: 6 }}
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>

      </div>
    </div>
  )
}
