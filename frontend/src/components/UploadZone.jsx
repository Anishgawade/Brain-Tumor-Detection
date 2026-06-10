import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import './Components.css'

export default function UploadZone({ onFiles, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (validFiles.length > 0) {
      onFiles(validFiles)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer',
          pointerEvents: disabled ? 'none' : 'auto', 
          opacity: disabled ? 0.6 : 1,
          background: dragOver ? 'rgba(59, 130, 246, 0.15)' : 'rgba(10, 15, 26, 0.6)',
          border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'}`,
          boxShadow: dragOver ? 'inset 0 0 30px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.1)' : '0 4px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(16px)',
          borderRadius: 20,
          padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: 250, width: '100%',
          overflow: 'hidden', position: 'relative'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: dragOver ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)' : 'none'
        }} />

        <span style={{ 
          color: dragOver ? '#3b82f6' : '#64748b', 
          transition: 'all 0.4s ease', 
          marginBottom: 16,
          transform: dragOver ? 'scale(1.1) translateY(-5px)' : 'scale(1) translateY(0)',
          filter: dragOver ? 'drop-shadow(0 0 10px rgba(59,130,246,0.6))' : 'none'
        }}>
          <UploadCloud size={54} strokeWidth={1.5} />
        </span>
        
        <p style={{ color: '#f8fafc', fontSize: 18, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
          Drop Advanced MRI Scans Here
        </p>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          or click to select clinical image files
        </p>
        <div style={{ 
          display: 'inline-block',
          padding: '4px 12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20
        }}>
          <p style={{ color: '#cbd5e1', fontSize: 11, fontFamily: 'monospace', margin: 0 }}>PNG · JPG · TIF · WEBP</p>
        </div>
      </div>
    </div>
  )
}
