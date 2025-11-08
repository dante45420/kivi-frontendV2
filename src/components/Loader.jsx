/**
 * Componente: Loader
 */
export default function Loader({ size = 'md', message = null }) {
  const sizes = {
    sm: 'loading',
    md: 'loading loading-lg',
    lg: 'loading loading-lg'
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '40px'
    }}>
      <div className={sizes[size]}></div>
      {message && (
        <p style={{ 
          margin: 0, 
          color: 'var(--kivi-text)',
          fontSize: '14px'
        }}>
          {message}
        </p>
      )}
    </div>
  )
}

