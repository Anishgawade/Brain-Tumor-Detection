import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Users, Activity, Calendar, UserRound, Download, Trash2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TumorBadge } from '../components/UI'
import toast from 'react-hot-toast'
import './Pages.css'

export default function Patients() {
  const { currentUser } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, "scans"),
      where("doctorId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = []
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() })
      })
      setScans(data)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching patients", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Group scans by patient name
  const patientsMap = scans.reduce((acc, scan) => {
    const name = scan.patientName || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(scan)
    return acc
  }, {})

  const patientNames = Object.keys(patientsMap)

  // Timeline Data for selected patient
  const timelineData = selectedPatient ? patientsMap[selectedPatient].slice().reverse().map((s, i) => ({
    name: `Scan ${i + 1}`,
    filename: s.filename || `Scan_${i+1}.mri`,
    prediction: s.prediction || (s.subtype === 'notumor' ? 'Clear' : 'Tumour'),
    confidence: s.confidence,
    date: s.timestamp ? new Date(s.timestamp.toDate()).toLocaleDateString() : 'Just now',
    subtype: s.subtype
  })) : []

  const handleDownloadTimeline = async () => {
    try {
      setDownloading(true)
      const pScans = patientsMap[selectedPatient]
      const lastScan = pScans[0] // most recent record holds best metadata
      
      const payload = {
        patient_name: selectedPatient,
        patient_id: lastScan.patientId || '',
        patient_age: lastScan.patientAge || '',
        patient_gender: lastScan.patientGender || '',
        patient_blood_group: lastScan.patientBloodType || '',
        scans: timelineData.map(t => ({
          date: t.date,
          filename: t.filename,
          prediction: t.prediction,
          confidence: t.confidence,
          tumor_type: t.subtype === 'notumor' ? 'No Tumor' : t.subtype.charAt(0).toUpperCase() + t.subtype.slice(1)
        }))
      }
      
      const { exportTimelineReport } = await import('../services/api')
      const response = await exportTimelineReport(payload)
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `NeuroScan_Timeline_${selectedPatient.replace(' ', '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Patient Timeline Report downloaded')
    } catch (e) {
      toast.error('Failed to generate report')
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  const handleDeletePatient = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete all MRI scans and timeline records for ${selectedPatient}? This action cannot be undone.`)) return
    
    try {
      setLoading(true)
      const pScans = patientsMap[selectedPatient]
      
      const batch = writeBatch(db)
      pScans.forEach(s => {
        batch.delete(doc(db, "scans", s.id))
      })
      await batch.commit()
      
      toast.success(`${selectedPatient}'s profile and all associated scans have been deleted.`)
      setSelectedPatient(null)
    } catch(e) {
      console.error(e)
      toast.error('Failed to delete patient records')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page history-page">
      <div className="page-header">
        <h1 className="page-title">Patient Records CRM</h1>
        <p className="page-subtitle">Track longitudinal brain scan histories and evaluate AI detection trends over time for individual patients.</p>
      </div>

      <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        
        {/* Patient Directory */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="history-toolbar">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Users size={18} /> Directory
            </h2>
          </div>
          
          <div style={{ padding: 20 }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading patient records...</p>
            ) : patientNames.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No patients registered assigned to you yet. Add a patient name during the Analyze process.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {patientNames.map(name => {
                  const pScans = patientsMap[name]
                  const lastScan = pScans[0]
                  return (
                    <div 
                      key={name} 
                      onClick={() => setSelectedPatient(name)}
                      className="page"
                      style={{ 
                        padding: 16, 
                        background: selectedPatient === name ? 'var(--bg-glass)' : 'transparent', 
                        border: `1px solid ${selectedPatient === name ? 'var(--cyan)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><UserRound size={16} />{name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pScans.length} scans</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TumorBadge subtype={lastScan.subtype} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12}/>{lastScan.timestamp ? new Date(lastScan.timestamp.toDate()).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Patient Timeline */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="history-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Activity size={18} /> {selectedPatient ? `${selectedPatient}'s Progression Timeline` : 'Select a Patient'}
            </h2>
            {selectedPatient && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleDeletePatient} 
                  className="btn btn-outline" 
                  style={{ padding: '6px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, height: 36, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                >
                  <Trash2 size={14} /> Delete Patient 
                </button>
                <button 
                  onClick={handleDownloadTimeline} 
                  className="btn btn-primary" 
                  style={{ padding: '6px 16px', fontSize: 13, gap: 8, height: 36 }}
                  disabled={downloading}
                >
                  <Download size={14} /> {downloading ? 'Generating...' : 'Download Report'}
                </button>
              </div>
            )}
          </div>
          
          <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedPatient ? (
              <>
                <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  <div style={{ flex: 1, background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Scans Captured</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{timelineData.length}</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current Diagnosis</div>
                    <div><TumorBadge subtype={timelineData[timelineData.length - 1].subtype} large/></div>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>AI Confidence Trajectory over Time</h3>
                <div style={{ flex: 1, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8 }}
                        formatter={(val) => [`${val.toFixed(1)}%`, 'Tumour Confidence']}
                      />
                      <Area type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorConf)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Click a patient on the left to view their detailed timeline analytics.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
