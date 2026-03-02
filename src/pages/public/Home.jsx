/**
 * Landing pública Kivi — Para atraer vendedores
 * Simple, con interacciones y transiciones llamativas.
 */
import { useEffect, useRef, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import Footer from '../../components/Footer'

const WHATSAPP_URL = 'https://wa.me/56969172764?text=Hola%20Kivi!%20Quiero%20ser%20vendedor%20y%20recibir%20más%20información.'

const benefits = [
  {
    title: 'Vende desde tu casa',
    desc: 'Sin local, sin horario fijo. Atiende a tus clientes cuando tú quieras, desde donde estés.',
    icon: '🏠',
    delay: 0,
  },
  {
    title: 'Solo coordinas la venta',
    desc: 'Nosotros tenemos el producto, los precios y la logística. Tú cierras el pedido y ganas comisión.',
    icon: '🤝',
    delay: 1,
  },
  {
    title: 'Comisiones hasta 15%',
    desc: 'Gana por cada venta que cierres. A más clientes, más ingresos. Sin tope.',
    icon: '📈',
    delay: 2,
  },
  {
    title: 'Sin stock ni riesgo',
    desc: 'No compras mercadería. Nosotros despachamos. Tú solo conectas clientes con fruta fresca.',
    icon: '✨',
    delay: 3,
  },
]

const steps = [
  { step: '1', text: 'Te sumas al equipo y accedes a precios y productos' },
  { step: '2', text: 'Compartes con tus conocidos y tomas pedidos' },
  { step: '3', text: 'Nosotros preparamos y entregamos; tú cobras tu comisión' },
]

const faqs = [
  {
    question: '¿Cómo funciona el envío?',
    answer: 'Tú nos pasas la dirección de entrega y el pedido armado. Nosotros nos encargamos del envío directo a tu cliente. El envío es sin costo para pedidos sobre $30.000; bajo ese monto se aplica un cargo de envío que te indicamos al sumarte.',
  },
  {
    question: '¿Cuánto es la comisión?',
    answer: 'Puedes ganar hasta 15% de comisión por cada venta que cierres. El porcentaje exacto te lo explicamos cuando te sumes al equipo, según el tipo de productos y el volumen.',
  },
  {
    question: '¿Necesito tener stock o comprar mercadería?',
    answer: 'No. Tú no compras ni guardas producto. Solo tomas el pedido de tu cliente y nos lo pasas. Nosotros tenemos el stock y despachamos. Cero riesgo para ti.',
  },
  {
    question: '¿Cómo y cuándo me pagan la comisión?',
    answer: 'Te pagamos la comisión de tus ventas al finalizar la semana. Te explicamos el proceso completo por WhatsApp cuando te contactes.',
  },
  {
    question: '¿Hay algún costo para empezar a vender?',
    answer: 'No hay costo de entrada. Solo te sumas, recibes la información de precios y productos, y empiezas a vender. Nosotros nos encargamos del resto.',
  },
  {
    question: '¿Hay mínimo de ventas semanales?',
    answer: 'Sí. No puedes vender solo a tu mamá o abuela; necesitamos un volumen mínimo para que sea viable. Te explicamos los detalles cuando te contactes.',
  },
]

export default function Home() {
  const heroRef = useRef(null)
  const benefitsRef = useRef(null)
  const stepsRef = useRef(null)
  const faqRef = useRef(null)
  const ctaRef = useRef(null)
  const [visible, setVisible] = useState({ hero: true, benefits: false, steps: false, faq: false, cta: false })
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const sections = [
      { ref: benefitsRef, key: 'benefits' },
      { ref: stepsRef, key: 'steps' },
      { ref: faqRef, key: 'faq' },
      { ref: ctaRef, key: 'cta' },
    ]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-section')
            if (key) setVisible((v) => ({ ...v, [key]: true }))
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    sections.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="kivi-landing">
      <PublicNavbar />

      {/* Hero */}
      <section ref={heroRef} className="kivi-hero" data-section="hero">
        <div className="kivi-hero-bg" />
        <div className="kivi-hero-content">
          <img
            src="/kivi-logo.png"
            alt="Kivi - Frutas y verduras frescas"
            className="kivi-hero-logo"
          />
          <h1 className="kivi-hero-title">
            Vende fruta fresca.<br />
            <span className="kivi-hero-highlight">Desde tu casa.</span>
          </h1>
          <p className="kivi-hero-sub">
            Nosotros tenemos el producto y la logística. Tú coordinas la venta y ganas hasta 15% de comisión.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="kivi-cta kivi-cta-primary"
          >
            Quiero vender
          </a>
        </div>
        <div className="kivi-hero-scroll" aria-hidden="true">
          <span>Scroll</span>
          <div className="kivi-hero-scroll-line" />
        </div>
      </section>

      {/* Benefits */}
      <section
        ref={benefitsRef}
        data-section="benefits"
        className={`kivi-section kivi-benefits ${visible.benefits ? 'is-visible' : ''}`}
      >
        <h2 className="kivi-section-title">¿Por qué vender con Kivi?</h2>
        <div className="kivi-benefits-grid">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="kivi-benefit-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="kivi-benefit-icon">{b.icon}</span>
              <h3 className="kivi-benefit-title">{b.title}</h3>
              <p className="kivi-benefit-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        ref={stepsRef}
        data-section="steps"
        className={`kivi-section kivi-steps ${visible.steps ? 'is-visible' : ''}`}
      >
        <h2 className="kivi-section-title">Así de simple</h2>
        <div className="kivi-steps-list">
          {steps.map((s, i) => (
            <div key={s.step} className="kivi-step" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="kivi-step-num">{s.step}</span>
              <p className="kivi-step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        ref={faqRef}
        data-section="faq"
        className={`kivi-section kivi-faq ${visible.faq ? 'is-visible' : ''}`}
      >
        <h2 className="kivi-section-title">Preguntas frecuentes</h2>
        <div className="kivi-faq-list">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className={`kivi-faq-item ${openFaq === idx ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className="kivi-faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
              >
                {item.question}
              </button>
              <div className="kivi-faq-answer" role="region" aria-hidden={openFaq !== idx}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section
        ref={ctaRef}
        data-section="cta"
        className={`kivi-section kivi-cta-block ${visible.cta ? 'is-visible' : ''}`}
      >
        <h2 className="kivi-cta-title">¿Listo para empezar?</h2>
        <p className="kivi-cta-sub">Escríbenos por WhatsApp y te contamos todo.</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="kivi-cta kivi-cta-primary kivi-cta-large"
        >
          Contactar por WhatsApp
        </a>
      </section>

      <Footer />

      <style>{`
        .kivi-landing { min-height: 100vh; background: var(--kivi-cream); }

        /* Hero */
        .kivi-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 80px;
          overflow: hidden;
        }
        .kivi-hero-bg {
          position: absolute;
          inset: 0;
          background-color: var(--kivi-cream);
          background-image: url(/kivi-bg-mobile.svg);
          background-size: cover;
          background-position: center;
        }
        @media (min-width: 769px) {
          .kivi-hero-bg {
            background-image: url(/kivi-bg-desktop.svg);
          }
        }
        .kivi-hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='rgba(255,255,255,0.04)' stroke-width='1' fill='none'/%3E%3C/svg%3E");
          opacity: 0.5;
        }
        .kivi-hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 560px;
          padding: 0 20px;
          transform: translateY(-20px);
        }
        .kivi-hero-logo {
          height: clamp(64px, 10vw, 92px);
          width: auto;
          margin-bottom: 20px;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
          animation: kivi-float 4s ease-in-out infinite;
        }
        @keyframes kivi-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .kivi-hero-title {
          font-size: clamp(24px, 4.5vw, 48px);
          font-weight: 800;
          color: var(--kivi-text-dark);
          line-height: 1.25;
          margin-bottom: 28px;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.5);
        }
        .kivi-hero-highlight {
          color: #2d6a4f;
          display: inline-block;
          position: relative;
        }
        .kivi-hero-highlight::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 4px;
          height: 6px;
          background: var(--kivi-orange);
          border-radius: 3px;
          opacity: 0.7;
          z-index: -1;
        }
        .kivi-hero-sub {
          font-size: clamp(15px, 2vw, 20px);
          color: var(--kivi-text-dark);
          line-height: 1.6;
          margin-bottom: 40px;
          text-shadow: 0 1px 2px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5);
          padding: 0 8px;
        }
        .kivi-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 16px 32px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 18px;
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: none;
          cursor: pointer;
        }
        .kivi-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.2); }
        .kivi-cta:active { transform: translateY(-1px); }
        .kivi-cta-primary {
          background: #2d6a4f;
          color: #fff;
        }
        .kivi-cta-large { padding: 20px 40px; font-size: 20px; }
        .kivi-hero-scroll {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--kivi-text);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .kivi-hero-scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--kivi-text-dark), transparent);
          border-radius: 1px;
          animation: kivi-scroll-line 2s ease-in-out infinite;
        }
        @keyframes kivi-scroll-line {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50% { opacity: 1; transform: scaleY(1); transform-origin: top; }
        }

        /* Section */
        .kivi-section {
          padding: 80px 24px;
          max-width: 1100px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .kivi-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .kivi-section-title {
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 800;
          color: var(--kivi-text-dark);
          text-align: center;
          margin-bottom: 48px;
          letter-spacing: -0.02em;
        }

        /* Benefits */
        .kivi-benefits { background: #fff; }
        .kivi-benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .kivi-benefit-card {
          background: var(--kivi-cream);
          border: 2px solid transparent;
          border-radius: 20px;
          padding: 28px 24px;
          text-align: center;
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
        }
        .kivi-section.is-visible .kivi-benefit-card {
          animation: kivi-card-in 0.6s ease forwards;
        }
        .kivi-benefit-card:hover {
          border-color: var(--kivi-green);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(45, 106, 79, 0.12);
        }
        @keyframes kivi-card-in {
          to { opacity: 1; transform: translateY(0); }
        }
        .kivi-benefit-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
          line-height: 1;
        }
        .kivi-benefit-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--kivi-text-dark);
          margin-bottom: 10px;
        }
        .kivi-benefit-desc {
          font-size: 15px;
          color: var(--kivi-text);
          line-height: 1.6;
          margin: 0;
        }

        /* Steps */
        .kivi-steps { background: var(--kivi-cream); }
        .kivi-steps-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
        }
        .kivi-step {
          display: flex;
          align-items: center;
          gap: 20px;
          max-width: 320px;
          opacity: 0;
          transform: translateX(-16px);
        }
        .kivi-section.is-visible .kivi-step {
          animation: kivi-step-in 0.6s ease forwards;
        }
        @keyframes kivi-step-in {
          to { opacity: 1; transform: translateX(0); }
        }
        .kivi-step-num {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #2d6a4f;
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kivi-step-text {
          font-size: 17px;
          color: var(--kivi-text-dark);
          font-weight: 600;
          line-height: 1.5;
          margin: 0;
        }

        /* FAQ */
        .kivi-faq { background: #fff; }
        .kivi-faq-list {
          max-width: 640px;
          margin: 0 auto;
        }
        .kivi-faq-item {
          border-bottom: 1px solid #eee;
          transition: background 0.2s ease;
        }
        .kivi-faq-item:first-child { border-top: 1px solid #eee; }
        .kivi-faq-question {
          width: 100%;
          padding: 20px 0;
          background: none;
          border: none;
          text-align: left;
          font-size: 17px;
          font-weight: 700;
          color: var(--kivi-text-dark);
          cursor: pointer;
          font-family: inherit;
          line-height: 1.4;
          transition: color 0.2s ease;
        }
        .kivi-faq-question:hover { color: #2d6a4f; }
        .kivi-faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease;
        }
        .kivi-faq-answer p {
          margin: 0 0 20px 0;
          padding: 0 0 20px 0;
          font-size: 15px;
          color: var(--kivi-text);
          line-height: 1.7;
        }
        .kivi-faq-item.is-open .kivi-faq-answer { max-height: 500px; }

        /* CTA block */
        .kivi-cta-block {
          background: linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%);
          border-radius: 24px;
          padding: 64px 24px;
          text-align: center;
          margin: 0 24px 80px;
        }
        .kivi-cta-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }
        .kivi-cta-sub {
          font-size: 18px;
          color: rgba(255,255,255,0.9);
          margin-bottom: 28px;
        }
        .kivi-cta-block .kivi-cta-primary {
          background: #fff;
          color: #2d6a4f;
        }
        .kivi-cta-block .kivi-cta-primary:hover {
          background: var(--kivi-cream);
          color: #1b4332;
        }

        @media (max-width: 768px) {
          .kivi-hero { padding: 90px 16px 60px; }
          .kivi-hero-content { padding: 0 16px; transform: translateY(-16px); }
          .kivi-hero-title { margin-bottom: 24px; }
          .kivi-hero-sub { margin-bottom: 32px; padding: 0 4px; }
          .kivi-benefits-grid { grid-template-columns: 1fr; }
          .kivi-steps-list { flex-direction: column; align-items: center; }
        }
      `}</style>
    </div>
  )
}
