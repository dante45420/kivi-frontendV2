import { useState, useEffect } from 'react'
import { fetchRandomTip, chatWithKivi } from '../api/kivi'

export default function KiviHelper() {
  const [isActive, setIsActive] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTip, setCurrentTip] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Cargar tip aleatorio cada 30 segundos si está activo
  useEffect(() => {
    if (!isActive) return
    
    const loadTip = async () => {
      try {
        const tip = await fetchRandomTip()
        setCurrentTip(tip)
      } catch (error) {
        console.error('Error cargando tip:', error)
      }
    }
    
    loadTip()
    const interval = setInterval(loadTip, 30000) // 30 segundos
    
    return () => clearInterval(interval)
  }, [isActive])
  
  const toggleActive = () => {
    setIsActive(!isActive)
    if (!isActive) {
      setIsExpanded(false)
    }
  }
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return
    
    const message = userInput.trim()
    setUserInput('')
    
    // Agregar mensaje del usuario
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    
    setIsLoading(true)
    
    try {
      const response = await chatWithKivi(message)
      setChatMessages(prev => [...prev, { role: 'kivi', content: response }])
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'kivi', 
        content: '¡Guau! Tuve un problema. ¿Puedes intentar de nuevo? 🐕' 
      }])
    }
    
    setIsLoading(false)
  }
  
  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => isActive ? setIsExpanded(!isExpanded) : toggleActive()}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          border: '4px solid var(--kivi-green)',
          background: isActive ? 'var(--kivi-green)' : '#f5f5f5',
          color: '#fff',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          animation: isActive ? 'bounce 2s infinite' : 'none',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <img src="/Perro_kivi.PNG" alt="Kivi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </button>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      
      {/* Tip flotante (solo si está activo y no expandido) */}
      {isActive && !isExpanded && currentTip && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          maxWidth: '280px',
          background: '#fff',
          border: '2px solid var(--kivi-green)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 998,
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <img 
              src="/Perro_kivi.PNG" 
              alt="Kivi" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                flexShrink: 0 
              }} 
            />
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--kivi-text)',
              lineHeight: 1.4
            }}>
              {currentTip.message}
            </p>
          </div>
          
          <button
            onClick={toggleActive}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              opacity: 0.5,
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Modal de chat expandido */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '380px',
          height: '500px',
          background: '#fff',
          border: '2px solid var(--kivi-green)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--kivi-green)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontWeight: 700
            }}>
              <img 
                src="/Perro_kivi.PNG" 
                alt="Kivi" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  objectFit: 'cover' 
                }} 
              />
              <span>Kivi te ayuda</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={toggleActive}
                className="button button-sm"
                style={{
                  background: isActive ? '#fff' : '#f5f5f5',
                  color: 'var(--kivi-green)'
                }}
              >
                {isActive ? '🔔' : '🔕'}
              </button>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="button button-sm"
                style={{ background: '#fff', color: 'var(--kivi-green)' }}
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '20px',
                fontSize: '14px'
              }}>
                <img 
                  src="/Perro_kivi.PNG" 
                  alt="Kivi" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    margin: '0 auto 12px' 
                  }} 
                />
                <p>¡Hola! Soy Kivi.<br/>¿En qué puedo ayudarte?</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: msg.role === 'user' ? 'var(--kivi-green)' : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : 'var(--kivi-text)',
                  fontSize: '14px',
                  lineHeight: 1.4
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f5f5f5'
                }}>
                  <div className="loading"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              className="input"
              placeholder="Pregúntale a Kivi..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              style={{ fontSize: '14px' }}
            />
            <button
              className="button"
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

