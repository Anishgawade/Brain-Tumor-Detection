import { useState, useCallback, useEffect } from 'react'
import { predictImage, exportReport } from '../services/api'
import UploadZone from '../components/UploadZone'
import { ConfidenceBar, TumorBadge, Spinner } from '../components/UI'
import './Pages.css'
import { TUMOR_TYPES } from './About'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { CheckCircle2, AlertTriangle, FileImage, X, Microscope, Download, Info, UploadCloud, UserPlus } from 'lucide-react'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CLASS_META = {
  glioma:     { color: '#ef4444', label: 'Glioma' },
  meningioma: { color: '#f97316', label: 'Meningioma' },
  notumor:    { color: '#22c55e', label: 'No Tumor' },
  pituitary:  { color: '#a855f7', label: 'Pituitary Tumor' },
}

const SYMPTOM_OPTIONS = ['Headache', 'Seizures', 'Vision Problems', 'Nausea', 'Cognitive Decline', 'Balance Issues', 'Speech Difficulty', 'Weakness']

export default function Analyze() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState([]) 
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientBloodType, setPatientBloodType] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0])
  const [patientId, setPatientId] = useState(`PT-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`)
  const [intakeComplete, setIntakeComplete] = useState(false)
  
  const [existingPatients, setExistingPatients] = useState({})
  const [isNewPatient, setIsNewPatient] = useState(true) // Start on form
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const toggleSymptom = (sym) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym])
  }
  
  const inputStyle = { 
    padding: '10px 14px', 
    height: 44, 
    background: 'rgba(10, 15, 26, 0.6)', 
    border: '1px solid rgba(59, 130, 246, 0.3)', 
    color: '#fff', 
    borderRadius: 8, 
    backdropFilter: 'blur(8px)', 
    outline: 'none', 
    transition: 'border-color 0.3s ease', 
    fontSize: 14,
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0
  }

  // Fetch unique patients assigned to this doctor
  useEffect(() => {
    if (!currentUser) return
    const fetchPatients = async () => {
      try {
        const q = query(collection(db, "scans"), where("doctorId", "==", currentUser.uid))
        const snap = await getDocs(q)
        const patientsMap = {}
        snap.forEach(doc => {
          const d = doc.data()
          if (d.patientName && !patientsMap[d.patientName]) {
            patientsMap[d.patientName] = { 
              id: d.patientId || `PT-${Math.floor(Math.random() * 1000000).toString().padStart(6,'0')}`,
              age: d.patientAge || '', 
              bloodType: d.patientBloodType || '',
              gender: d.patientGender || '',
              contact: d.contactNumber || '',
              email: d.email || '',
              history: d.medicalHistory || '',
              symptoms: d.symptoms || []
            }
          }
        })
        setExistingPatients(patientsMap)
      } catch (e) {
        console.error("Failed to load patient directory", e)
      }
    }
    fetchPatients()
  }, [currentUser])

  const handleFiles = useCallback((files) => {
    const newItems = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      result: null,
      error: null,
      loading: false,
      gradcamMode: 'overlay'
    }))
    setItems((prev) => [...prev, ...newItems])
    toast.success(`Added ${files.length} file(s) to queue`)
  }, [])

  const removeFile = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const setItemState = (id, updates) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)))
  }

  const analyzeItem = async (it) => {
    setItemState(it.id, { loading: true, error: null, result: null })
    try {
      const { data } = await predictImage(it.file)
      setItemState(it.id, { result: data, loading: false })
      toast.success(`Analysis complete: ${it.file.name}`)
      // Track upload in Firebase
      try {
        await addDoc(collection(db, "scans"), {
          filename: it.file.name,
          prediction: data.prediction,
          confidence: Number((data.confidence * 100).toFixed(2)),
          subtype: data.subtype,
          timestamp: serverTimestamp(),
          doctorId: currentUser?.uid || 'anonymous',
          patientName: patientName.trim() || 'Unknown Patient',
          patientId: patientId,
          patientAge: patientAge,
          patientBloodType: patientBloodType,
          patientGender: patientGender,
          contactNumber: contactNumber,
          email: email,
          medicalHistory: medicalHistory,
          symptoms: symptoms,
          scanDate: scanDate
        })
      } catch (fbErr) {
        console.error("Firebase tracking error", fbErr)
      }
    } catch (err) {
      setItemState(it.id, { error: err.message || 'Analysis failed.', loading: false })
      toast.error(`Analysis failed for ${it.file.name}`)
    }
  }

  const analyzeAll = async () => {
    setAnalyzingAll(true)
    const unanalyzed = items.filter((it) => !it.result && !it.error)
    if (unanalyzed.length > 0) toast.loading(`Analyzing ${unanalyzed.length} items...`, { id: 'analyze-all' })
    for (const it of unanalyzed) {
      await analyzeItem(it)
    }
    toast.success('Batch analysis complete', { id: 'analyze-all' })
    setAnalyzingAll(false)
  }

  const handleDownload = async (it) => {
    try {
      setItemState(it.id, { downloading: true })
      
      const origBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(it.file);
      });

      const metaData = TUMOR_TYPES.find(t => t.id === it.result.subtype) || { symptoms: [], treatment: [] };
      const isTumor = it.result.prediction === 'Tumour';

      const response = await exportReport({
        filename: it.file.name,
        prediction: it.result.prediction,
        confidence: it.result.confidence,
        tumor_type: CLASS_META[it.result.subtype]?.label || it.result.subtype,
        patient_name: patientName.trim() || 'Not Specified',
        patient_id: patientId,
        patient_age: patientAge || '',
        patient_blood_group: patientBloodType || '',
        gender: patientGender || '',
        contact: contactNumber || '',
        scan_date: scanDate,
        clinical_notes: medicalHistory.trim(),
        tumor_volume_mm3: it.result.tumor_volume_mm3 || 0.0,
        gradcam_base64: (it.result.gradcam && isTumor) ? `data:image/png;base64,${it.result.gradcam.overlay}` : "",
        original_base64: origBase64,
        symptoms: symptoms.length > 0 ? symptoms : metaData.symptoms.slice(0, 4),
        treatments: metaData.treatment.slice(0, 4)
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NeuroScan_Report_${it.file.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully')
    } catch (err) {
      toast.error("Failed to download report: " + err.message);
    } finally {
      setItemState(it.id, { downloading: false })
    }
  }

  const hasUnanalyzed = items.some((it) => !it.result && !it.error)

  return (
    <div className="page analyze-page">
      <div className="page-header">
        <h1 className="page-title">MRI Batch Analysis</h1>
        <p className="page-subtitle">Upload multiple brain MRI scans for side-by-side AI classification</p>
      </div>

      <div className="analyze-grid">
        {/* Upload panel (Sticky) */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* 1. Patient Demographics */}
          <div className="glass-card upload-panel">
            <h2 className="section-title" style={{ marginBottom: 20 }}>1. Patient Demographics</h2>
            
            {intakeComplete ? (
              <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{patientName} <span style={{fontSize: 12, color: 'var(--text-muted)', fontWeight: 400}}>({patientId})</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{patientAge} yrs</span> • <span>{patientGender}</span> {patientBloodType && <>• <span>{patientBloodType}</span></>}
                  </div>
                </div>
                <button onClick={() => setIntakeComplete(false)} className="btn btn-outline" style={{ padding: '6px 16px', fontSize: 13 }}>
                  Edit Profile
                </button>
              </div>
            ) : (
              !isNewPatient ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ 
                      flex: 1, paddingLeft: 40, height: 44, 
                      background: 'rgba(10, 15, 26, 0.6)', 
                      border: dropdownOpen ? '1px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)', 
                      color: patientName ? '#fff' : '#64748b', 
                      borderRadius: 8, display: 'flex', alignItems: 'center', cursor: 'pointer', 
                      backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
                      boxShadow: dropdownOpen ? '0 0 15px rgba(59,130,246,0.15)' : 'none'
                    }}
                  >
                    <UserPlus size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                    {patientName || '-- Select Existing Patient --'}
                  </div>
                  
                  {dropdownOpen && (
                    <div style={{ 
                      position: 'absolute', top: 50, left: 0, right: 0, 
                      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.4)', 
                      borderRadius: 8, zIndex: 100, backdropFilter: 'blur(16px)', 
                      overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                    }}>
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {Object.keys(existingPatients).length === 0 ? (
                          <div style={{ padding: '12px 16px', color: '#64748b' }}>No existing patients found.</div>
                        ) : (
                          Object.keys(existingPatients).sort().map(name => (
                            <div 
                              key={name}
                              onClick={() => { 
                                setPatientName(name); 
                                const pd = existingPatients[name];
                                setPatientId(pd.id);
                                setPatientAge(pd.age);
                                setPatientBloodType(pd.bloodType);
                                setPatientGender(pd.gender || '');
                                setContactNumber(pd.contact || '');
                                setEmail(pd.email || '');
                                setMedicalHistory(pd.history || '');
                                setSymptoms(pd.symptoms || []);
                                setDropdownOpen(false); 
                                setIsNewPatient(true);
                              }}
                              style={{ padding: '12px 16px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.2)'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{name}</span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>{existingPatients[name].age} yrs</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div 
                        onClick={() => { setIsNewPatient(true); setPatientName(''); setContactNumber(''); setEmail(''); setMedicalHistory(''); setSymptoms([]); setDropdownOpen(false); setPatientId(`PT-${Math.floor(Math.random() * 1000000).toString().padStart(6,'0')}`) }}
                        style={{ padding: '12px 16px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, background: 'rgba(59,130,246,0.05)' }}
                      >
                        + Create New Patient Profile
                      </div>
                    </div>
                  )}
                  <button onClick={() => setIsNewPatient(true)} className="btn btn-outline" style={{width: '100%'}}>New Patient Intake</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {patientId}</span>
                    <button onClick={() => setIsNewPatient(false)} className="btn btn-ghost" style={{ fontSize: 11, height: 24, padding: '0 8px' }}>Existing Patient?</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ gridColumn: 'span 3', minWidth: 0 }}>
                      <input type="text" placeholder="Full Name *" value={patientName} onChange={(e) => setPatientName(e.target.value)} style={inputStyle} />
                    </div>
                    
                    <div style={{ minWidth: 0 }}><input type="number" placeholder="Age *" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} style={inputStyle} /></div>
                    <div style={{ minWidth: 0 }}>
                      <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} style={inputStyle}>
                        <option value="" disabled>Gender *</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <select value={patientBloodType} onChange={(e) => setPatientBloodType(e.target.value)} style={inputStyle}>
                        <option value="" disabled>Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>

                    <div style={{ minWidth: 0 }}><input type="tel" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={inputStyle} /></div>
                    <div style={{ minWidth: 0 }}><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} /></div>
                    <div style={{ minWidth: 0 }}><input type="date" value={scanDate} onChange={(e) => setScanDate(e.target.value)} style={inputStyle} /></div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Reported Symptoms</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {SYMPTOM_OPTIONS.map(sym => (
                        <div 
                          key={sym} 
                          onClick={() => toggleSymptom(sym)} 
                          style={{ 
                            padding: '4px 10px', borderRadius: 16, fontSize: 11, cursor: 'pointer', 
                            background: symptoms.includes(sym) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(10, 15, 26, 0.4)',
                            border: `1px solid ${symptoms.includes(sym) ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                            color: symptoms.includes(sym) ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {sym}
                        </div>
                      ))}
                    </div>
                  </div>

                  <textarea 
                    placeholder="Medical History (Optional)" 
                    value={medicalHistory} 
                    onChange={(e) => setMedicalHistory(e.target.value)} 
                    style={{ ...inputStyle, height: 60, resize: 'none' }} 
                  />

                  <button 
                    className="btn btn-primary" 
                    style={{ height: 44, fontSize: 14 }}
                    disabled={!patientName || !patientAge || !patientGender}
                    onClick={() => {
                      setIntakeComplete(true);
                      toast.success("Demographics Verified");
                    }}
                  >
                    Proceed to MRI Upload
                  </button>
                </div>
              )
            )}
          </div>

          {/* 2. Upload MRI Scans */}
          {intakeComplete && (
            <div className="glass-card upload-panel" style={{ animation: 'slide-up 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className="section-title" style={{ margin: 0 }}>2. Upload & Analysis</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                  <CheckCircle2 size={12} /> Intake Data Verified
                </div>
              </div>
              <UploadZone onFiles={handleFiles} disabled={analyzingAll} />

            {items.length > 0 && (
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Queue ({items.length})
                  </h3>
                  {items.length > 1 && (
                    <button onClick={() => setItems([])} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize: 11 }}>
                      Clear All
                    </button>
                  )}
                </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '200px', overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                {items.map((it) => (
                  <div key={it.id} className="file-info" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      <span style={{flexShrink:0}}>
                        {it.result ? <CheckCircle2 size={16} className="text-green" /> : 
                         it.error ? <AlertTriangle size={16} className="text-red" /> : 
                         <FileImage size={16} className="text-muted" />}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{it.file.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {(it.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    {!analyzingAll && (
                      <button onClick={() => removeFile(it.id)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {hasUnanalyzed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(!patientName || !patientAge || !patientGender) && (
                    <div style={{ fontSize: 12, color: 'var(--orange)', textAlign: 'center', padding: '4px 0' }}>
                      <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }}/>
                      Please complete Patient Demographics above before analyzing.
                    </div>
                  )}
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: (!patientName || !patientAge || !patientGender) ? 0.5 : 1 }} 
                    onClick={analyzeAll}
                    disabled={analyzingAll || !patientName || !patientAge || !patientGender}
                  >
                    {analyzingAll ? 'Running...' : <><Microscope size={16} /> Analyze All Pending</>}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {analyzingAll && <div style={{marginTop: 20}}><Spinner text="Analyzing MRI using deep learning model..." /></div>}
            </div>
          )}
        </div>

        {/* Results Stream */}
        <div className="results-stream" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {items.map((it) => {
            if (!it.result && !it.loading && !it.error) return null;
            
            const result = it.result;
            const meta = result ? CLASS_META[result.subtype] || CLASS_META.notumor : null;
            const isTumor = result?.prediction === 'Tumour';

            return (
              <div key={it.id} className="result-panel" style={{ animation: 'scale-up 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 className="section-title" style={{ paddingLeft: 8, borderLeft: '3px solid var(--cyan)', margin: 0 }}>
                    Analysis: {it.file.name}
                  </h2>
                  {result && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleDownload(it)}
                      disabled={it.downloading}
                    >
                      {it.downloading ? 'Generating PDF...' : <><Download size={14} /> Download Report</>}
                    </button>
                  )}
                </div>
                
                {it.loading && (
                  <div className="glass-card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="skeleton-line" style={{ width: '40%', height: 28, borderRadius: 6 }} />
                      <div className="skeleton-line" style={{ width: '100%', height: 14, borderRadius: 4 }} />
                      <div className="skeleton-line" style={{ width: '85%', height: 14, borderRadius: 4 }} />
                      <div style={{ display: 'flex', gap: 20, marginTop: 32 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div className="skeleton-line" style={{ width: '100%', height: 60, borderRadius: 8 }} />
                          <div className="skeleton-line" style={{ width: '100%', height: 60, borderRadius: 8 }} />
                          <div className="skeleton-line" style={{ width: '100%', height: 60, borderRadius: 8 }} />
                        </div>
                        <div className="skeleton-line" style={{ flex: 1, height: 212, borderRadius: 12 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                        <Spinner text="Deep Learning Neural Network Processing..." />
                      </div>
                    </div>
                  </div>
                )}
                {it.error && <div className="error-box" style={{margin:0, display:'flex', alignItems:'center', gap: 8}}><AlertTriangle size={18} /><p>{it.error}</p></div>}
                
                {result && (
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div className={`glass-card verdict-card ${isTumor ? 'verdict-tumor' : 'verdict-clear'}`}>
                        <div className="verdict-header">
                          <div>
                            <div className="verdict-result" style={{display:'flex', alignItems:'center', gap: 6}}>
                              {isTumor ? <><AlertTriangle size={18} /> Tumour Detected</> : <><CheckCircle2 size={18} /> No Tumour Detected</>}
                            </div>
                            <TumorBadge subtype={result.subtype} large />
                          </div>
                          <div className="verdict-conf">
                            <div className="conf-big" style={{ color: meta?.color }}>
                              {(result.confidence * 100).toFixed(2)}% 
                            </div>  
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</div>
                          </div>
                        </div>
                        <p className="verdict-desc">{result.tumor_info?.description}</p>
                        
                        {isTumor && result.tumor_volume_mm3 && (
                          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'monospace', marginBottom: 6, letterSpacing: 1 }}>EST. TUMOUR SIZE</div>
                              <div style={{ 
                                display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 8, fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
                                background: result.tumor_volume_mm3 < 5000 ? 'rgba(34, 197, 94, 0.15)' : result.tumor_volume_mm3 < 15000 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: result.tumor_volume_mm3 < 5000 ? '#4ade80' : result.tumor_volume_mm3 < 15000 ? '#fb923c' : '#fca5a5',
                                border: `1px solid ${result.tumor_volume_mm3 < 5000 ? 'rgba(34,197,94,0.3)' : result.tumor_volume_mm3 < 15000 ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.3)'}`
                              }}>
                                {result.tumor_volume_mm3 < 5000 ? 'SMALL MASS' : result.tumor_volume_mm3 < 15000 ? 'MEDIUM MASS' : 'LARGE MASS'}
                              </div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AlertTriangle size={20} color="#fca5a5" />
                            </div>
                          </div>
                        )}

                        <div className="probs-list" style={{ marginTop: 24 }}>
                          {Object.entries(result.all_probabilities).map(([cls, prob]) => (
                            <ConfidenceBar
                              key={cls}
                              label={CLASS_META[cls]?.label || cls}
                              value={prob}
                              color={CLASS_META[cls]?.color || '#888'}
                            />
                          ))}
                        </div>
                      </div>

                      {result && result.prediction === 'Tumour' && (
                        <div className="glass-card" style={{ padding: '20px' }}>
                          {(() => {
                            const metaData = TUMOR_TYPES.find(t => t.id === result.subtype)
                            if (!metaData) return null;
                            return (
                              <>
                                <h3 className="section-title" style={{fontSize: 14, marginBottom: 12, color: metaData.color, display:'flex', alignItems:'center', gap: 6}}>
                                  <Info size={16} /> {metaData.name} Insights
                                </h3>
                                <div style={{display: 'flex', gap: 16}}>
                                  <div style={{flex: 1}}>
                                    <h4 style={{fontSize: 12, color:'var(--text-muted)'}}>Symptoms</h4>
                                    <ul style={{fontSize: 12, paddingLeft: 16, marginTop: 4, color: 'var(--text-secondary)', lineHeight: 1.6}}>
                                      {metaData.symptoms.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                                    </ul>
                                  </div>
                                  <div style={{flex: 1}}>
                                    <h4 style={{fontSize: 12, color:'var(--text-muted)'}}>Common Measures</h4>
                                    <ul style={{fontSize: 12, paddingLeft: 16, marginTop: 4, color: 'var(--text-secondary)', lineHeight: 1.6}}>
                                      {metaData.treatment.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Grad-CAM */}
                    {result.gradcam && isTumor && (
                      <div className="glass-card gradcam-card" style={{ padding: '24px 20px' }}>
                        <div className="gradcam-header" style={{ marginBottom: 16 }}>
                          <h3 className="section-title" style={{fontSize: 14}}>AI Explainability (Grad-CAM)</h3>
                          <div className="toggle-btns">
                            <button
                              className={`toggle-btn toggle-original ${it.gradcamMode === 'original' ? 'active' : ''}`}
                              onClick={() => setItemState(it.id, { gradcamMode: 'original' })}
                            >Original</button>
                            <button
                              className={`toggle-btn toggle-overlay ${it.gradcamMode === 'overlay' ? 'active' : ''}`}
                              onClick={() => setItemState(it.id, { gradcamMode: 'overlay' })}
                            >Overlay</button>
                            <button
                              className={`toggle-btn toggle-box ${it.gradcamMode === 'box' ? 'active' : ''}`}
                              onClick={() => setItemState(it.id, { gradcamMode: 'box' })}
                            >Localization</button>
                          </div>
                        </div>
                        <div className="gradcam-view">
                          {it.gradcamMode === 'original' ? (
                            <img src={URL.createObjectURL(it.file)} alt="Original" className="gradcam-img" style={{maxHeight: 220, width: 'auto'}} />
                          ) : it.gradcamMode === 'overlay' ? (
                            <img src={`data:image/png;base64,${result.gradcam.overlay}`} alt="Overlay" className="gradcam-img" style={{maxHeight: 220, width: 'auto'}} />
                          ) : (
                            <img src={`data:image/png;base64,${result.gradcam.box}`} alt="Bounding Box" className="gradcam-img" style={{maxHeight: 220, width: 'auto'}} />
                          )}
                          <p className="gradcam-caption" style={{marginTop: 8}}>
                            <span className="medical-tooltip" data-tip="Class Activation Mappings isolating visual AI thresholds">Grad-CAM</span> highlights regions of the MRI that influenced the multidimensional spatial mapping decision. Red areas indicate diagnostic hot-zones.
                          </p>
                          <div className="gradcam-legend" style={{marginTop: 8}}>
                            <span className="legend-item"><span className="legend-color" style={{background: '#ef4444'}}></span> High</span>
                            <span className="legend-item"><span className="legend-color" style={{background: '#eab308'}}></span> Med</span>
                            <span className="legend-item"><span className="legend-color" style={{background: '#3b82f6'}}></span> Low</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {items.length === 0 && (
            <div className="empty-state" style={{flex: 1, justifyContent: 'center'}}>
              <UploadCloud size={48} style={{ color: 'var(--text-muted)' }} />
              <p>Upload scans to begin analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
