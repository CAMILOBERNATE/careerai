import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const MENSAJES = [
  '¡Hola! Soy Ruti 🐾',
  'Soy tu guía laboral del SENA...',
  'Te ayudaré a conseguir ese trabajo que mereces 💼',
  '¿Listo para empezar? ¡Vamos! 🚀',
]

export default function Bienvenida() {
  const navigate = useNavigate()
  const [msgIndex, setMsgIndex] = useState(0)
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState(true)
  const [mostrarBoton, setMostrarBoton] = useState(false)

  useEffect(() => {
    let i = 0
    const msg = MENSAJES[msgIndex]
    setTexto('')
    setEscribiendo(true)

    const intervalo = setInterval(() => {
      setTexto(msg.slice(0, i + 1))
      i++
      if (i === msg.length) {
        clearInterval(intervalo)
        setEscribiendo(false)
        if (msgIndex < MENSAJES.length - 1) {
          setTimeout(() => setMsgIndex(m => m + 1), 1000)
        } else {
          setTimeout(() => setMostrarBoton(true), 500)
        }
      }
    }, 45)

    return () => clearInterval(intervalo)
  }, [msgIndex])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003DA5 0%, #002d7a 50%, #001a4d 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Huellas decorativas de fondo */}
      {[
        { top: '8%',  left: '5%',  rot: -20, op: 0.08, size: 28 },
        { top: '15%', left: '88%', rot: 15,  op: 0.07, size: 22 },
        { top: '30%', left: '3%',  rot: 10,  op: 0.06, size: 18 },
        { top: '55%', left: '92%', rot: -10, op: 0.08, size: 24 },
        { top: '70%', left: '6%',  rot: 25,  op: 0.07, size: 20 },
        { top: '80%', left: '85%', rot: -5,  op: 0.06, size: 26 },
        { top: '90%', left: '20%', rot: 15,  op: 0.05, size: 18 },
        { top: '45%', left: '96%', rot: -20, op: 0.06, size: 16 },
      ].map((h, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: h.top, left: h.left,
          fontSize: h.size,
          transform: `rotate(${h.rot}deg)`,
          opacity: h.op,
          color: '#795548',
          pointerEvents: 'none',
        }}>🐾</div>
      ))}

      {/* Logo SENA arriba */}
      <div style={{
        position: 'absolute',
        top: 24, right: 32,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          background: 'var(--verde)',
          color: 'white',
          fontSize: 10, fontWeight: 800,
          padding: '4px 12px', borderRadius: 99,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          SENA 2026
        </div>
      </div>

      {/* Contenido central */}
      <div style={{ textAlign: 'center', maxWidth: 480, zIndex: 1 }}>

        {/* Perrito Ruti */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>

          {/* Bocadillo de texto */}
          <div style={{
            position: 'absolute',
            top: -70, left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: 16,
            padding: '12px 20px',
            minWidth: 240,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003DA5' }}>
              {texto}
              {escribiendo && (
                <span style={{
                  display: 'inline-block',
                  width: 2, height: 14,
                  background: '#003DA5',
                  marginLeft: 2,
                  animation: 'blink 0.8s infinite',
                  verticalAlign: 'middle',
                }} />
              )}
            </span>
            {/* Triángulo del bocadillo */}
            <div style={{
              position: 'absolute',
              bottom: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid white',
            }} />
          </div>

          {/* Emoji perrito */}
          <div style={{
            width: 120, height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '4px solid var(--verde)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: 68,
            boxShadow: '0 0 40px rgba(57,169,0,0.4)',
            animation: 'fadeUp 0.6s ease',
          }}>
            🐶
          </div>

          {/* Huellas debajo del perrito */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 4, marginTop: 10,
          }}>
            {[0,1,2,3,4].map(i => (
              <span key={i} style={{
                fontSize: 14,
                color: '#795548',
                opacity: 0.4 + (i * 0.12),
                transform: `rotate(${i % 2 === 0 ? '-15deg' : '15deg'})`,
                display: 'inline-block',
              }}>🐾</span>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <h1 style={{
          fontSize: 48, fontWeight: 800,
          color: 'white', letterSpacing: -1,
          marginBottom: 8, marginTop: 16,
        }}>
          Ruti
        </h1>
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.6)',
          marginBottom: 40, lineHeight: 1.6,
        }}>
          Asistente Laboral Inteligente del SENA
        </p>

        {/* Botón entrar */}
        {mostrarBoton && (
          <button
            onClick={() => navigate('/inicio')}
            style={{
              padding: '14px 48px',
              background: 'var(--verde)',
              border: 'none', borderRadius: 99,
              color: 'white', fontWeight: 800,
              fontSize: 16, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(57,169,0,0.4)',
              animation: 'fadeUp 0.4s ease',
              transition: 'all 0.2s',
              letterSpacing: 0.5,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            ¡Empecemos! 🐾
          </button>
        )}
      </div>

      {/* Huellas caminando abajo */}
      <div style={{
        position: 'absolute', bottom: 24,
        display: 'flex', gap: 8, opacity: 0.3,
      }}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <span key={i} style={{
            fontSize: 16, color: '#795548',
            transform: `rotate(${i % 2 === 0 ? '-10deg' : '10deg'}) translateY(${i % 2 === 0 ? '0px' : '6px'})`,
            display: 'inline-block',
          }}>🐾</span>
        ))}
      </div>
    </div>
  )
}