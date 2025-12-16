/**
 * Componente: Footer público mejorado
 */
import { Link } from 'react-router-dom'

export default function Footer() {
  const whatsappUrl = "https://wa.me/56969172764?text=Hola%20Green%20Market!%20Quiero%20hacer%20un%20pedido"
  const instagramUrl = "https://instagram.com/greenmarket.chile"
  
  return (
    <footer style={{
      background: 'var(--kivi-text-dark)',
      color: '#fff',
      padding: '48px 20px 24px',
      marginTop: '60px'
    }}>
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Main Content Centrado */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '32px',
          marginBottom: '40px'
        }}>
          {/* Brand */}
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {/* Logo con slogan */}
              <img 
                src="/Logo_con_slogan.png" 
                alt="Green Market" 
                style={{ height: '60px' }} 
              />
            </div>
            <p style={{
              fontSize: '14px',
              lineHeight: 1.6,
              opacity: 0.8,
              margin: '0 0 16px 0'
            }}>
              Tu personal shopper de Lo Valledor.<br />
              Productos frescos directo a tu casa.
            </p>
          </div>
          
          {/* Enlaces de navegación */}
          <div>
            <div style={{
              display: 'flex',
              gap: '24px',
              justifyContent: 'center'
            }}>
              <Link
                to="/"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  opacity: 0.8,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                Inicio
              </Link>
              <Link
                to="/catalogo"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  opacity: 0.8,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                Catálogo
              </Link>
            </div>
          </div>
          
          {/* Social Icons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Contáctanos por WhatsApp"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'transform 0.2s',
                padding: '10px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src="/logo_whatsapp-Photoroom.png" alt="WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </a>
            
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Síguenos en Instagram"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'transform 0.2s',
                padding: '10px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src="/logo_instagram (2).png" alt="Instagram" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </a>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
          opacity: 0.6
        }}>
            <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} Green Market. Lo Valledor, Santiago.
          </p>
        </div>
      </div>
    </footer>
  )
}

