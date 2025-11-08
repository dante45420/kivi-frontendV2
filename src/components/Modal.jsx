/**
 * Componente: Modal genérico
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg'
  }
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className={`modal ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)',
            paddingBottom: 'var(--space)',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--kivi-text-dark)'
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}

