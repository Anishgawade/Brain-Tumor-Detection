import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchHealth } from '../services/api'
import { Home, LayoutDashboard, Microscope, ClipboardList, Info, Sun, Moon, ChevronRight, ChevronLeft, LogOut, LogIn, Users } from 'lucide-react'
import './Sidebar.css'

const NAV = [
  { to: '/',         icon: <Home size={18} />,  label: 'Home'       },
  { to: '/dashboard',icon: <LayoutDashboard size={18} />,  label: 'Dashboard'  },
  { to: '/patients', icon: <Users size={18} />, label: 'Patients'   },
  { to: '/analyze',  icon: <Microscope size={18} />, label: 'Analyze'    },
  { to: '/history',  icon: <ClipboardList size={18} />, label: 'History'    },
  { to: '/about',    icon: <Info size={18} />,  label: 'About'      },
]

export default function Sidebar({ theme, toggleTheme, isOpen, toggleSidebar }) {
  const [online, setOnline] = useState('loading') // 'loading', 'active', 'error'
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  
  async function handleAuthAction() {
    if (currentUser) {
      await logout()
      navigate('/login')
    } else {
      navigate('/login')
    }
  }

  useEffect(() => {
    let mounted = true
    let fastInterval = null
    let slowInterval = null

    const check = async () => {
      try {
        const { data } = await fetchHealth()
        if (!mounted) return
        setOnline(data.status) // 'active', 'loading', 'error'
        
        // Once model is confirmed active, switch to slow 30s polling
        if (data.status === 'active' && fastInterval) {
          clearInterval(fastInterval)
          fastInterval = null
          slowInterval = setInterval(check, 30000)
        }
      } catch {
        if (mounted) setOnline('error')
      }
    }

    check()
    // Poll every 3s until model loads (covers TF startup time)
    fastInterval = setInterval(check, 3000)
    // Safety: after 90s, switch to slow polling regardless
    const safetyTimer = setTimeout(() => {
      if (fastInterval) { clearInterval(fastInterval); fastInterval = null }
      if (!slowInterval) slowInterval = setInterval(check, 30000)
    }, 90000)

    return () => {
      mounted = false
      if (fastInterval) clearInterval(fastInterval)
      if (slowInterval) clearInterval(slowInterval)
      clearTimeout(safetyTimer)
    }
  }, [])

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="24" cy="20" rx="14" ry="12" stroke="#63d2ff" strokeWidth="2" fill="none"/>
            <path d="M10 20 Q8 28 14 32 Q18 35 24 35 Q30 35 34 32 Q40 28 38 20" stroke="#63d2ff" strokeWidth="2" fill="none"/>
            <path d="M24 8 Q24 4 24 8" stroke="#63d2ff" strokeWidth="2"/>
            <circle cx="18" cy="17" r="2" fill="#a855f7"/>
            <circle cx="28" cy="15" r="2" fill="#a855f7"/>
            <circle cx="24" cy="22" r="2" fill="#63d2ff"/>
            <line x1="18" y1="17" x2="24" y2="22" stroke="#63d2ff" strokeWidth="1" opacity="0.6"/>
            <line x1="28" y1="15" x2="24" y2="22" stroke="#63d2ff" strokeWidth="1" opacity="0.6"/>
            <line x1="18" y1="17" x2="28" y2="15" stroke="#63d2ff" strokeWidth="1" opacity="0.4"/>
          </svg>
        </div>
        {isOpen && (
          <div>
            <div className="brand-name">NeuroScan</div>
            <div className="brand-sub">AI Detection</div>
          </div>
        )}
      </div>

      <button className="collapse-btn" onClick={toggleSidebar} title="Toggle Sidebar" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Model status */}
      <div className={`model-status ${online === 'active' ? 'online' : online === 'error' ? 'offline' : 'loading'}`}>
        <span className="status-dot" />
        {isOpen && (
          <span className="status-text" style={{display:'flex', alignItems:'center', gap: 6}}>
            {online === 'active' ? (
              <><span style={{color: 'var(--green)', fontSize: 24}}></span> Model Active</>
            ) : online === 'error' ? (
              <><span style={{color: 'var(--red)', fontSize: 24}}></span> Model Error</>
            ) : (
              <><span style={{color: 'var(--orange)', fontSize: 24}}></span> Loading Model</>
            )}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            title={!isOpen ? label : undefined}
          >
            <span className="nav-icon">{icon}</span>
            {isOpen && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Theme & Auth Controls */}
      <div className="sidebar-theme-toggle" style={{display:'flex', flexDirection:'column', gap: 8}}>
        <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={!isOpen ? 'Toggle Theme' : undefined} style={{display:'flex', alignItems:'center', gap: 8, justifyContent:'center'}}>
          {isOpen ? (theme === 'dark' ? <><Sun size={18} /> Light Mode</> : <><Moon size={18} /> Dark Mode</>) : (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
        </button>
        <button className="theme-btn" onClick={handleAuthAction} style={{display:'flex', alignItems:'center', gap: 8, justifyContent:'center', color: currentUser ? 'var(--red)' : 'var(--cyan)'}}>
          {isOpen ? (
            currentUser ? <><LogOut size={18} /> Sign Out</> : <><LogIn size={18} /> Doctor Login</>
          ) : (
            currentUser ? <LogOut size={18} /> : <LogIn size={18} />
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {isOpen ? (
          <>
            <div className="footer-badge">
              <span>v2.0.0</span>
              <span className="divider">·</span>
              <span>ResNet50</span>
            </div>
            <div className="footer-disclaimer">For research use only</div>
          </>
        ) : (
          <div className="footer-badge" style={{ justifyContent: 'center' }}>
            <span>v2</span>
          </div>
        )}
      </div>
    </aside>
  )
}
