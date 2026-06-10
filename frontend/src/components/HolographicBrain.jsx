import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ScanFace } from 'lucide-react'

const anatomyData = [
  { id: 'frontal', name: 'Frontal Lobe', pos: { top: '35%', left: '25%' }, color: '#3b82f6', desc: 'Executive functions, decision making, and motor control.' },
  { id: 'parietal', name: 'Parietal Lobe', pos: { top: '25%', left: '55%' }, color: '#8b5cf6', desc: 'Processes sensory information and spatial awareness.' },
  { id: 'occipital', name: 'Occipital Lobe', pos: { top: '50%', left: '75%' }, color: '#ec4899', desc: 'Visual processing center.' },
  { id: 'temporal', name: 'Temporal Lobe', pos: { top: '60%', left: '45%' }, color: '#10b981', desc: 'Auditory processing and long-term memory.' },
  { id: 'cerebellum', name: 'Cerebellum', pos: { top: '75%', left: '65%' }, color: '#f59e0b', desc: 'Coordinates voluntary movements and balance.' },
  { id: 'stem', name: 'Brain Stem', pos: { top: '85%', left: '50%' }, color: '#64748b', desc: 'Controls autonomic survival functions.' }
]

function Hotspot({ data, isHighlighted, onHover, onLeave, active }) {
  const baseColor = isHighlighted ? '#ef4444' : data.color
  
  return (
    <div 
      style={{ position: 'absolute', top: data.pos.top, left: data.pos.left, transform: 'translate(-50%, -50%)', zIndex: active ? 50 : 10 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Node Marker */}
      <div style={{
        width: 16, height: 16, borderRadius: '50%', 
        background: `radial-gradient(circle, #fff 0%, ${baseColor} 60%)`,
        boxShadow: `0 0 15px ${baseColor}, 0 0 ${active ? '30px' : '10px'} ${baseColor}`,
        cursor: 'crosshair',
        transition: 'all 0.3s ease',
        transform: active ? 'scale(1.5)' : 'scale(1)',
        animation: isHighlighted ? 'pulse 1.5s infinite' : 'none'
      }} />

      {/* Floating Info Box */}
      <div className="glass-card" style={{
        position: 'absolute', top: -10, left: 30,
        background: 'rgba(10, 15, 26, 0.9)',
        border: `1px solid ${active ? baseColor : 'rgba(255,255,255,0.1)'}`,
        boxShadow: active ? `0 0 20px ${baseColor}40` : 'none',
        padding: '8px 12px',
        borderRadius: 8,
        color: '#fff',
        fontFamily: 'monospace',
        minWidth: 160,
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: active ? 1 : 0,
        transform: active ? 'translateX(0px) scale(1)' : 'translateX(-10px) scale(0.9)'
      }}>
        {active && (
          <svg style={{ position: 'absolute', top: 12, left: -20, width: 20, height: 2, overflow: 'visible' }}>
            <line x1="0" y1="0" x2="20" y2="0" stroke={baseColor} strokeWidth="2" strokeDasharray="4 2" />
          </svg>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {isHighlighted ? <AlertTriangle size={14} color={baseColor} /> : <CheckCircle2 size={14} color={baseColor} />}
          <strong style={{ color: baseColor, letterSpacing: 1, fontSize: 12 }}>{data.name.toUpperCase()}</strong>
        </div>
        <div style={{ color: '#a1a1aa', fontSize: 10, whiteSpace: 'normal', lineHeight: 1.4 }}>
          {isHighlighted ? 'CRITICAL: Tumorous anomaly detected in cortical region.' : data.desc}
        </div>
      </div>
    </div>
  )
}

export default function HolographicBrain() {
  const [viewMode, setViewMode] = useState('normal')
  const [hoveredNode, setHoveredNode] = useState(null)

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 450, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* 2D Interactive Map Container */}
      <div style={{ position: 'relative', width: 400, height: 400 }}>
        {/* Radar Rings Background */}
        <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%)', borderRadius: '50%', border: '1px dashed rgba(59,130,246,0.2)', animation: 'spin 20s linear infinite' }} />
        
        {/* The 2D Brain Image */}
        <img 
          src="/brain_ai_bg.png" 
          alt="Brain Map" 
          style={{ 
            width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)',
            opacity: 0.9, filter: `drop-shadow(0 0 20px rgba(59, 130, 246, 0.4)) brightness(1.2)`,
            mixBlendMode: 'screen',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 60%)'
          }} 
        />

        {/* Anatomical Hotspots */}
        {anatomyData.map((data) => (
          <Hotspot 
            key={data.id} 
            data={data} 
            isHighlighted={viewMode === 'tumour' && data.id === 'frontal'} 
            active={hoveredNode === data.id || (viewMode === 'tumour' && data.id === 'frontal')}
            onHover={() => setHoveredNode(data.id)}
            onLeave={() => setHoveredNode(null)}
          />
        ))}

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1.5); } 50% { opacity: 0.6; transform: scale(1.2); } }
        `}</style>
      </div>

    </div>
  )
}
