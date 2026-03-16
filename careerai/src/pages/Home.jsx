import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { preguntarGemini } from '../lib/gemini.js'

const MODULOS = [
  { path: '/crear-cv',   icon: '📝', title: 'Crear CV',          color: '#795548' },
  { path: '/subir-cv',   icon: '📤', title: 'Subir CV (ATS)',     color: '#795548' },
  { path: '/entrevista', icon: '🎯', title: 'Simular Entrevista', color: '#795548' },
  { path: '/chat',       icon: '💬', title: 'Chat Laboral',       color: '#795548' },
  { path: '/tips',       icon: '💡', title: 'Tips y Consejos',    color: '#795548' },
]

export default function Home() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [cargando, setCargando] = useState(false)

  const preguntar = async () => {
    if (!input.trim() || cargando) return
    setCargando(true)
    setRespuesta('')
    const res = await preguntarGemini([{ role: 'user', text: input }])
    setRespuesta(res)
    setCargando(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0f7ff 0%, #f5f5f5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
    }}>

      {/* Ruti centrado con bocadillo */}
      <div style={{ position: 'relative', marginBottom: 16, marginTop: 20 }}>

        {/* Bocadillo */}
        <div style={{
          position: 'absolute',
          top: -70, left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: 20,
          padding: '14px 24px',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '2px solid var(--verde)',
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: 'var(--azul)',
          }}>
            ¡Consigue ese trabajo que mereces! 💼
          </span>
          {/* Triángulo */}
          <div style={{
            position: 'absolute',
            bottom: -12, left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '12px solid var(--verde)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -9, left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid white',
          }} />
        </div>

        {/* Perrito */}
        <div style={{
          width: 110, height: 110,
          borderRadius: '50%',
          background: 'white',
          border: '4px solid var(--verde)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 62,
          boxShadow: '0 8px 32px rgba(57,169,0,0.2)',
          margin: '0 auto',
        }}>
          🐶
        </div>

        {/* Huellas debajo */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: 4, marginTop: 10,
        }}>
          {[0,1,2,3,4].map(i => (
            <span key={i} style={{
              fontSize: 14, color: '#795548',
              opacity: 0.3 + (i * 0.12),
              transform: `rotate(${i % 2 === 0 ? '-15deg' : '15deg'})`,
              display: 'inline-block',
            }}>🐾</span>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div style={{
        fontWeight: 800, fontSize: 15,
        color: 'var(--azul)', marginBottom: 4,
      }}>
        Ruti — Asistente Laboral IA
      </div>

      {/* Campo de pregunta */}
      <div style={{
        width: '100%', maxWidth: 560,
        marginBottom: 12, marginTop: 8,
      }}>
        <div style={{
          display: 'flex', gap: 8,
          background: 'white',
          border: '2px solid var(--verde)',
          borderRadius: 99, padding: '6px 6px 6px 20px',
          boxShadow: '0 4px 20px rgba(57,169,0,0.15)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && preguntar()}
            placeholder="Pregúntale algo a Ruti sobre tu carrera..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, color: 'var(--texto)',
              outline: 'none',
            }}
          />
          <button
            onClick={preguntar}
            disabled={cargando || !input.trim()}
            style={{
              padding: '10px 22px',
              background: cargando || !input.trim() ? 'var(--gris2)' : 'var(--verde)',
              border: 'none', borderRadius: 99,
              color: 'white', fontWeight: 700,
              fontSize: 13, cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {cargando ? '⏳' : 'Preguntar 🐾'}
          </button>
        </div>

        {/* Respuesta de Ruti */}
        {(respuesta || cargando) && (
          <div style={{
            marginTop: 12,
            background: 'white',
            border: '1px solid var(--gris2)',
            borderLeft: '4px solid var(--verde)',
            borderRadius: 12, padding: '14px 18px',
            fontSize: 14, color: 'var(--texto)',
            lineHeight: 1.7,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {cargando ? (
              <span style={{ color: 'var(--texto2)' }}>
                🐾 Ruti está pensando...
              </span>
            ) : (
              <>
                <span style={{ fontWeight: 700, color: 'var(--verde)' }}>🐶 Ruti: </span>
                {respuesta}
              </>
            )}
          </div>
        )}
      </div>

      {/* Módulos en forma de huellas */}
      <div style={{ marginTop: 24, width: '100%', maxWidth: 640 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: '#795548', textTransform: 'uppercase',
          letterSpacing: '0.1em', textAlign: 'center',
          marginBottom: 16, opacity: 0.7,
        }}>
          🐾 ¿Qué quieres hacer hoy? 🐾
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: 14,
        }}>
          {MODULOS.map((m, i) => (
            <div
              key={m.path}
              onClick={() => navigate(m.path)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {/* Huella */}
              <div style={{
                width: 80, height: 88,
                position: 'relative',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* SVG huella de perro */}
                <svg width="80" height="88" viewBox="0 0 80 88" fill="none">
                  {/* Almohadilla principal */}
                  <ellipse cx="40" cy="60" rx="28" ry="22" fill="#795548" opacity="0.85"/>
                  {/* Deditos */}
                  <ellipse cx="18" cy="38" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="34" cy="30" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="50" cy="30" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="64" cy="38" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                </svg>
                {/* Emoji encima */}
                <div style={{
                  position: 'absolute',
                  fontSize: 22,
                  marginTop: 14,
                }}>
                  {m.icon}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: '#5D4037', textAlign: 'center',
                maxWidth: 80,
              }}>
                {m.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}