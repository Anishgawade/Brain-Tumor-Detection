import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStats, fetchHistory } from '../services/api'
import { StatCard, TumorBadge } from '../components/UI'
import HolographicBrain from '../components/HolographicBrain'
import { Microscope, Activity, BarChart3, Clock, FolderOpen } from 'lucide-react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import './Pages.css'

const CLASS_COLORS = {
  glioma:     '#ef4444',
  meningioma: '#f97316',
  notumor:    '#22c55e',
  pituitary:  '#a855f7',
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liveStats, setLiveStats] = useState([])

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "scans"), where("doctorId", "==", currentUser.uid), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Process real-time stats locally instead of python backend memory
      const by_class = {}
      let tumors = 0
      data.forEach(s => {
        by_class[s.subtype] = (by_class[s.subtype] || 0) + 1
        if (s.prediction === 'Tumour' || s.prediction === 'Tumor') tumors++
      })
      const most_common = Object.keys(by_class).length > 0 ? Object.keys(by_class).reduce((a, b) => by_class[a] > by_class[b] ? a : b) : 'notumor'
      
      setStats({
        total_predictions: data.length,
        tumor_detected: tumors,
        by_class,
        most_common_class: most_common,
        recent_prediction: data.length > 0 ? data[0].subtype : null
      })
      // Reverse to get chronological order for chart
      data.reverse();
      setLiveStats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const accuracy = 99.4
  const byClass = stats?.by_class || {}

  const chartData = liveStats.length > 0 
    ? liveStats.map((s, i) => ({ ...s, confidence: s.confidence <= 1 ? Math.round(s.confidence * 100) : Math.round(s.confidence), index: i }))
    : [
          { confidence: 85, name: 'Benchmark 1' },
          { confidence: 87, name: 'Benchmark 2' },
          { confidence: 88, name: 'Benchmark 3' },
          { confidence: 91, name: 'Benchmark 4' },
          { confidence: 90, name: 'Benchmark 5' },
          { confidence: 94, name: 'Benchmark 6' },
          { confidence: 93, name: 'Benchmark 7' },
          { confidence: 96, name: 'Benchmark 8' },
          { confidence: 98, name: 'Benchmark 9' },
          { confidence: 99, name: 'Benchmark 10' }
        ];

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time overview of your NeuroScan AI session</p>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          icon={<Microscope size={24} />}
          value={loading ? '—' : stats?.total_predictions ?? 0}
          label="Total Scans"
          sub="This session"
          color="var(--cyan)"
          delay={0}
        />
        <StatCard
          icon={<Activity size={24} />}
          value={loading ? '—' : stats?.tumor_detected ?? 0}
          label="Tumours Detected"
          sub="Positive cases"
          color="var(--red)"
          delay={80}
        />
        <StatCard
          icon={<BarChart3 size={24} />}
          value={loading ? '—' : (stats?.most_common_class === 'notumor' ? 'None' : stats?.most_common_class?.replace('glioma', 'Glioma')?.replace('meningioma', 'Meningioma')?.replace('pituitary', 'Pituitary') || 'N/A')}
          label="Most Frequent"
          sub="Primary occurrence"
          color="var(--orange)"
          delay={160}
        />
        <StatCard
          icon={<Clock size={24} />}
          value={loading ? '—' : stats?.recent_prediction?.replace('notumor', 'No Tumour')?.replace('glioma', 'Glioma')?.replace('meningioma', 'Meningioma')?.replace('pituitary', 'Pituitary') || 'N/A'}
          label="Last Scan"
          sub="Recent result"
          color="var(--purple)"
          delay={240}
        />
      </div>

      <div className="dashboard-bottom" style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: 24, alignItems: 'start' }}>
        
        {/* 2D Brain Viewer */}
        <div className="glass-card dist-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <HolographicBrain />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Class distribution */}
          <div className="glass-card dist-card">
            <h2 className="section-title">Class Distribution</h2>
            {Object.keys(byClass).length === 0 ? (
              <div className="empty-state">
                <BarChart3 size={40} style={{ color: 'var(--text-muted)' }} />
                <p>Upload MRI scans to see class distribution</p>
              </div>
            ) : (
              <div className="dist-bars">
                {Object.entries(byClass).map(([cls, count]) => {
                  const pct = stats.total_predictions > 0
                    ? Math.round((count / stats.total_predictions) * 100)
                    : 0
                  return (
                    <div key={cls} className="dist-row">
                      <div className="dist-label">
                        <TumorBadge subtype={cls} />
                        <span className="dist-count">{count}</span>
                      </div>
                      <div className="dist-track">
                        <div
                          className="dist-fill"
                          style={{ width: `${pct}%`, background: CLASS_COLORS[cls] }}
                        />
                      </div>
                      <span className="dist-pct">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Accuracy Trend Chart */}
          <div className="glass-card dist-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Detection Confidence Trend</h2>
            <div style={{ flex: 1, minHeight: 200, width: '100%', paddingRight: 10 }}>
              <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="index" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8 }}
                      formatter={(val) => [`${val.toFixed(1)}%`, 'Confidence']}
                      labelFormatter={() => 'Scan Result'}
                    />
                    <Area type="monotone" dataKey="confidence" stroke="var(--cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorConfidence)" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent scans */}
      <div className="glass-card recent-card" style={{ marginTop: 24 }}>
        <div className="section-header">
          <h2 className="section-title">Recent Scans</h2>
          <Link to="/history" className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
            View All
          </Link>
        </div>
        {liveStats.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p>No scans yet. <Link to="/analyze">Upload your first MRI →</Link></p>
          </div>
        ) : (
          <div className="recent-table">
            <div className="table-header">
              <span>File</span>
              <span>Type</span>
              <span>Confidence</span>
              <span>Time</span>
            </div>
            {liveStats.slice(0, 5).map((r) => (
              <div key={r.id} className="table-row">
                <span className="file-name" title={r.filename}>{r.filename}</span>
                <TumorBadge subtype={r.subtype} />
                <span className="conf-text" style={{ color: CLASS_COLORS[r.subtype] }}>
                  {r.confidence <= 1 ? Math.round(r.confidence * 100) : Math.round(r.confidence)}%
                </span>
                <span className="time-text">
                  {r.timestamp?.toDate 
                    ? r.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : new Date(r.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
