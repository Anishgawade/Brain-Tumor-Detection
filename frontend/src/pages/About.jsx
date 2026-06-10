import { Link } from 'react-router-dom'
import { CircleDot, AlertTriangle } from 'lucide-react'
import './Pages.css'

export const TUMOR_TYPES = [
  {
    id: 'glioma',
    icon: <CircleDot size={20} />,
    name: 'Glioma',
    severity: 'High Risk',
    severityLevel: 4,
    color: '#ef4444',
    description: 'Gliomas are tumors that arise from glial cells in the brain or spine. They are the most common type of primary brain tumor and vary widely in aggressiveness from grade I (benign) to grade IV (glioblastoma, highly malignant).',
    prevalence: '~45%',
    symptoms: ['Persistent headaches', 'Seizures', 'Nausea & vomiting', 'Memory problems', 'Vision/speech changes'],
    treatment: ['Surgical resection', 'Radiation therapy', 'Temozolomide chemotherapy', 'Bevacizumab therapy'],
  },
  {
    id: 'meningioma',
    icon: <CircleDot size={20} />,
    name: 'Meningioma',
    severity: 'Low–Moderate',
    severityLevel: 2,
    color: '#f97316',
    description: 'Meningiomas arise from the meninges, the protective membranes surrounding the brain and spinal cord. They are the most common benign intracranial tumor, typically slow-growing with good prognosis after treatment.',
    prevalence: '~36%',
    symptoms: ['Headaches', 'Weakness in limbs', 'Personality changes', 'Vision or hearing issues', 'Seizures (rare)'],
    treatment: ['Active surveillance', 'Microsurgery', 'Stereotactic radiosurgery', 'Radiation therapy'],
  },
  {
    id: 'pituitary',
    icon: <CircleDot size={20} />,
    name: 'Pituitary Tumor',
    severity: 'Low–Moderate',
    severityLevel: 2,
    color: '#a855f7',
    description: 'Pituitary adenomas form in the pituitary gland at the base of the brain. Most are benign (non-cancerous) and may affect hormone levels, causing a range of systemic effects depending on the hormones involved.',
    prevalence: '~15%',
    symptoms: ['Headaches behind eyes', 'Vision loss', 'Hormonal imbalances', 'Fatigue', 'Unexplained weight changes'],
    treatment: ['Dopamine agonists (medication)', 'Transsphenoidal surgery', 'Gamma Knife radiosurgery', 'Hormone replacement'],
  },
  {
    id: 'notumor',
    icon: <CircleDot size={20} />,
    name: 'No Tumor',
    severity: 'Normal',
    severityLevel: 0,
    color: '#22c55e',
    description: 'The MRI scan shows no evidence of a brain tumor. Brain tissue appears within normal parameters. This result does not rule out other neurological conditions; always consult a medical professional for complete evaluation.',
    prevalence: '—',
    symptoms: ['No tumor-related symptoms'],
    treatment: ['No treatment required', 'Regular clinical follow-up if symptoms persist'],
  },
]

export default function About() {
  return (
    <div className="page about-page">
      <div className="page-header">
        <h1 className="page-title">About NeuroScan AI</h1>
        <p className="page-subtitle">Understanding the tumor classifications</p>
      </div>

      {/* Tumor type cards */}
      <h2 className="section-title" style={{ marginBottom: 20 }}>Tumor Classifications</h2>
      <div className="tumor-cards-grid">
        {TUMOR_TYPES.map((t) => (
          <div key={t.id} className="glass-card tumor-type-card" style={{ '--tc': t.color }}>
            <div className="tc-header">
              <span className="tc-icon">{t.icon}</span>
              <div>
                <div className="tc-name" style={{ color: t.color }}>{t.name}</div>
                <div className="tc-severity">{t.severity}</div>
              </div>
              {t.prevalence !== '—' && <div className="tc-prev">{t.prevalence}<span>prevalence</span></div>}
            </div>

            <div className="severity-dots-row">
              {[1,2,3,4].map(i => (
                <div key={i} className="sev-dot" style={{ background: i <= t.severityLevel ? t.color : 'var(--border)' }} />
              ))}
              <span className="sev-label">{t.severity}</span>
            </div>

            <p className="tc-desc">{t.description}</p>

            <div className="tc-lists">
              <div>
                <div className="tc-list-title">Symptoms</div>
                <ul className="tc-list">
                  {t.symptoms.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div className="tc-list-title">Treatment</div>
                <ul className="tc-list">
                  {t.treatment.slice(0, 3).map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="glass-card disclaimer-card">
        <h3 style={{ color: '#f97316', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} /> Medical Disclaimer
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
          NeuroScan AI is developed <strong>for educational and research purposes only</strong>. It should
          not be used as a substitute for professional medical diagnosis, treatment, or clinical decision-making.
          The tool is not clinically validated and results may be inaccurate. Always consult a licensed
          neurologist or radiologist for proper diagnosis and care.
        </p>
      </div>
    </div>
  )
}
