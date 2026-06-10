import { Link } from 'react-router-dom'
import BrainModel from '../components/BrainModel'
import { Rocket, Zap, Eye, ShieldCheck } from 'lucide-react'
import './Pages.css'

export default function Home() {
  return (
    <div className="page" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
      
      {/* Subtle Background Image */}
      <div style={{ position: 'absolute', top: -80, left: -20, right: -20, bottom: -80, zIndex: -1, opacity: 0.08, backgroundImage: 'url(/brain_ai_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'screen', pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }} />

      <div className="home-hero-split" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
        
        {/* Left: Content */}
        <div style={{ flex: '1 1 500px', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: 30, background: 'var(--bg-glass)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', alignItems: 'center' }}>
            <Rocket size={16} style={{ color: 'var(--cyan)', marginRight: 6 }} /> Fully Updated Model System v2.0
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)' }}>
            Welcome to <br />
            <span style={{ color: 'var(--cyan)' }}>NeuroScan AI</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 540, marginBottom: 32, lineHeight: 1.6 }}>
            Advanced, deep-learning powered MRI analysis for real-time brain tumor classification. Delivering pinpoint accuracy and full visual explainability.
          </p>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/analyze" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 16, borderRadius: 12 }}>
              Start Analysis
            </Link>
            <Link to="/dashboard" className="btn btn-ghost" style={{ padding: '16px 32px', fontSize: 16, borderRadius: 12 }}>
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Right: 3D Model & Brain Image */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: 400 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, aspectRatio: '1', borderRadius: '50%', background: 'radial-gradient(circle, var(--cyan) 0%, transparent 60%)', opacity: 0.8 }}>
            <img src="/brain_ai_bg.png" alt="Brain" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, opacity: 0.6, maskImage: 'radial-gradient(circle, black 40%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <BrainModel />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid-3" style={{ textAlign: 'left', animation: 'fade-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', marginTop: 80 }}>
        
        <div className="glass-card" style={{ padding: 24, borderTop: '3px solid var(--cyan)' }}>
          <div style={{ marginBottom: 16, color: 'var(--cyan)' }}><Zap size={28} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Real-Time Inference</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Sub-second AI scans allowing near-instantaneous feedback during diagnostic review.</div>
        </div>

        <div className="glass-card" style={{ padding: 24, borderTop: '3px solid var(--purple)' }}>
          <div style={{ marginBottom: 16, color: 'var(--purple)' }}><Eye size={28} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Visual Explainability</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Native Grad-CAM heatmap overlays highlighting the exact scan regions influencing the model.</div>
        </div>

        <div className="glass-card" style={{ padding: 24, borderTop: '3px solid var(--green)' }}>
          <div style={{ marginBottom: 16, color: 'var(--green)' }}><ShieldCheck size={28} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>4-Class Detection</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>High-accuracy screening targeting Glioma, Meningioma, Pituitary tumors, and negative baselines.</div>
        </div>

      </div>
    </div>
  )
}
