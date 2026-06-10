import { useEffect, useState, useMemo } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { TumorBadge } from '../components/UI'
import { Search, ClipboardList, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import './Pages.css'

const CLASS_COLORS = {
  glioma: '#ef4444', meningioma: '#f97316', notumor: '#22c55e', pituitary: '#a855f7',
}
const PAGE_SIZE = 10

export default function History() {
  const { currentUser } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "scans"), where("doctorId", "==", currentUser.uid), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setHistory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filtered = useMemo(() => {
    return history.filter((r) => {
      const matchSearch = r.filename.toLowerCase().includes(search.toLowerCase())
      const matchClass  = filterClass === 'all' || r.subtype === filterClass
      return matchSearch && matchClass
    })
  }, [history, search, filterClass])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="page history-page">
      <div className="page-header">
        <h1 className="page-title">Scan History</h1>
        <p className="page-subtitle">All MRI scans analysed this session</p>
      </div>

      {/* Filters */}
      <div className="glass-card history-controls">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search by filename…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="filter-pills">
          {['all', 'glioma', 'meningioma', 'pituitary', 'notumor'].map((cls) => (
            <button
              key={cls}
              className={`filter-pill ${filterClass === cls ? 'active' : ''}`}
              style={filterClass === cls && cls !== 'all' ? { borderColor: CLASS_COLORS[cls], color: CLASS_COLORS[cls] } : {}}
              onClick={() => { setFilterClass(cls); setPage(1) }}
            >
              {cls === 'all' ? 'All' : cls === 'notumor' ? 'No Tumor' : cls.charAt(0).toUpperCase() + cls.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card history-table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={40} className="text-muted" style={{ marginBottom: 12 }} />
            <p>{history.length === 0 ? 'No scans yet. Analyze an MRI to get started.' : 'No results match your filters.'}</p>
          </div>
        ) : (
          <>
            <div className="hist-table">
              <div className="hist-header">
                <span>#</span>
                <span>File</span>
                <span>Result</span>
                <span>Type</span>
                <span>Confidence</span>
                <span>Timestamp</span>
              </div>
              {paginated.map((r, i) => (
                <div key={r.id} className={`hist-row ${r.subtype}`}>
                  <span className="row-id">{(page - 1) * PAGE_SIZE + i + 1}</span>
                  <span className="row-file" title={r.filename}>{r.filename}</span>
                  <span className={`row-result ${r.prediction === 'Tumour' ? 'tumor' : 'clear'}`} style={{ display:'flex', alignItems:'center', gap: 6 }}>
                    {r.prediction === 'Tumour' ? <><AlertTriangle size={14} /> Tumour</> : <><CheckCircle2 size={14} /> Clear</>}
                  </span>
                  <TumorBadge subtype={r.subtype} />
                  <span className="row-conf" style={{ color: CLASS_COLORS[r.subtype] }}>
                    {r.confidence <= 1 ? Math.round(r.confidence * 100) : Math.round(r.confidence)}%
                  </span>
                  <span className="row-time">
                    {r.timestamp?.toDate 
                      ? r.timestamp.toDate().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : new Date(r.timestamp || Date.now()).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span className="page-info">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
              <div className="page-btns">
                <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={16} />
                </button>
                <span className="page-num">{page} / {totalPages}</span>
                <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
