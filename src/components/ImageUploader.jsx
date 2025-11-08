/**
 * Componente: Subir imagen
 */
import { useState } from 'react'

export default function ImageUploader({ currentImage, onUpload, onDelete, loading = false }) {
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
    
    // Upload
    await onUpload(file)
  }
  
  const handleDelete = async () => {
    setPreviewUrl(null)
    await onDelete()
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Preview */}
      {previewUrl && (
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          border: '2px solid #eee'
        }}>
          <img 
            src={previewUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {!loading && (
            <button
              onClick={handleDelete}
              className="button danger button-sm"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px'
              }}
            >
              🗑️
            </button>
          )}
        </div>
      )}
      
      {/* Upload button */}
      {!loading && (
        <label className="button secondary" style={{ cursor: 'pointer' }}>
          <span>📷</span>
          <span>{previewUrl ? 'Cambiar foto' : 'Subir foto'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </label>
      )}
      
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="loading"></div>
          <span style={{ fontSize: '14px', color: 'var(--kivi-text)' }}>
            Subiendo...
          </span>
        </div>
      )}
    </div>
  )
}

