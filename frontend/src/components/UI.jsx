import './Components.css'

export function StatCard({ icon, value, label, sub, color, delay = 0 }) {
  return (
    <div 
      className="glass-card stat-card" 
      style={{ 
        animationDelay: `${delay}ms`,
        backgroundColor: color,
        border: 'none',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <span className="stat-icon" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}}>{icon}</span>
      <div className="stat-value" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", background: "transparent" }}>{value}</div>
      <div className="stat-label" style={{ color: "rgba(255, 255, 255, 0.95)" }}>{label}</div>
      {sub && <div className="stat-sub" style={{ color: "rgba(255, 255, 255, 0.75)" }}>{sub}</div>}
    </div>
  )
}

export function ConfidenceBar({ label, value, color, delay = 0 }) {
  const pct = (value * 100).toFixed(2)
  return (
    <div className="conf-bar-wrap" style={{ animationDelay: `${delay}ms` }}>
      <div className="conf-bar-header">
        <span className="conf-bar-label">{label}</span>
        <span className="conf-bar-pct" style={{ color }}>{pct}%</span>
      </div>
      <div className="conf-bar-track">
        <div
          className="conf-bar-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
    </div>
  )
}

export function TumorBadge({ subtype, large = false }) {
  const labels = {
    glioma: 'Glioma',
    meningioma: 'Meningioma',
    notumor: 'No Tumour',
    pituitary: 'Pituitary',
  }
  return (
    <span
      className={`tumor-badge ${subtype || 'notumor'}`}
      style={{ fontSize: large ? 15 : 12, padding: large ? '6px 14px' : undefined }}
    >
      {labels[subtype] || subtype || 'Unknown'}
    </span>
  )
}

export function Spinner({ text = 'Analyzing…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner-ring" />
      <p className="spinner-text">{text}</p>
    </div>
  )
}

export function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
