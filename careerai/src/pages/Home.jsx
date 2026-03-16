import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { preguntarGemini } from '../lib/gemini.js'

const MODULOS = [
  { path: '/crear-cv',   icon: '📝', title: 'Crear CV',          color: '#795548' },
  { path: '/subir-cv',   icon: '📤', title: 'Subir CV (ATS)',     color: '#795548' },
  { path: '/entrevista', icon: '🎯', title: 'Simular Entrevista', color: '#795548' },
  { path: '/chat',       icon: '💬', title: 'Chat Laboral',       color: '#795548' },
  { path: '/tips',       icon: '💡', title: 'Tips y Consejos',    color: '#795548' },
]

function formatearTexto(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function Home() {
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState([{
    role: 'bot',
    text: '¡Hola! 🐾 Soy <strong>Ruti</strong>, tu asistente laboral del SENA. ¿En qué te puedo ayudar hoy?'
  }])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const preguntar = async (texto) => {
    const msg = texto || input
    if (!msg.trim() || cargando) return
    setInput('')
    setMensajes(m => [...m, { role: 'user', text: msg }])
    setCargando(true)
    const historial = [...mensajes, { role: 'user', text: msg }]
    const res = await preguntarGemini(historial)
    setMensajes(m => [...m, { role: 'bot', text: formatearTexto(res) }])
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
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--azul)' }}>
            ¡Consigue ese trabajo que mereces! 💼
          </span>
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

        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
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

      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--azul)', marginBottom: 4 }}>
        Ruti — Asistente Laboral IA
      </div>

      {/* Chat tipo conversación */}
      <div style={{
        width: '100%', maxWidth: 580,
        background: 'white',
        borderRadius: 16,
        border: '1px solid var(--gris2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        marginTop: 12, marginBottom: 16,
        overflow: 'hidden',
      }}>
        {/* Mensajes */}
        <div style={{
          maxHeight: 320,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {mensajes.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 8,
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
                background: m.role === 'user' ? 'var(--azul)' : 'var(--verde)',
              }}>
                {m.role === 'user' ? '👤' : '🐶'}
              </div>
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 13,
                lineHeight: 1.65,
                background: m.role === 'user' ? 'var(--azul)' : 'var(--gris)',
                color: m.role === 'user' ? 'white' : 'var(--texto)',
                borderTopLeftRadius: m.role === 'user' ? 12 : 4,
                borderTopRightRadius: m.role === 'user' ? 4 : 12,
                border: m.role === 'user' ? 'none' : '1px solid var(--gris2)',
              }}>
                <span dangerouslySetInnerHTML={{ __html: m.text }} />
              </div>
            </div>
          ))}
          {cargando && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--verde)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
              }}>🐶</div>
              <div style={{
                padding: '10px 14px',
                background: 'var(--gris)',
                border: '1px solid var(--gris2)',
                borderRadius: 12, borderTopLeftRadius: 4,
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--verde)',
                    display: 'inline-block',
                    animation: `blink 1.2s ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8,
          padding: '10px 12px',
          borderTop: '1px solid var(--gris2)',
          background: 'white',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && preguntar()}
            placeholder="Pregúntale algo a Ruti sobre tu carrera..."
            style={{
              flex: 1, border: '1px solid var(--gris2)',
              background: 'var(--gris)',
              borderRadius: 99, fontSize: 13,
              color: 'var(--texto)', outline: 'none',
              padding: '9px 16px',
            }}
          />
          <button
            onClick={() => preguntar()}
            disabled={cargando || !input.trim()}
            style={{
              padding: '9px 18px',
              background: cargando || !input.trim() ? 'var(--gris2)' : 'var(--verde)',
              border: 'none', borderRadius: 99,
              color: 'white', fontWeight: 700,
              fontSize: 13, cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {cargando ? '⏳' : 'Enviar 🐾'}
          </button>
        </div>
      </div>

      {/* Módulos en forma de huellas */}
      <div style={{ width: '100%', maxWidth: 640 }}>
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
                cursor: 'pointer', transition: 'all 0.2s', gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{
                width: 80, height: 88,
                position: 'relative',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="80" height="88" viewBox="0 0 80 88" fill="none">
                  <ellipse cx="40" cy="60" rx="28" ry="22" fill="#795548" opacity="0.85"/>
                  <ellipse cx="18" cy="38" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="34" cy="30" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="50" cy="30" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                  <ellipse cx="64" cy="38" rx="10" ry="13" fill="#795548" opacity="0.85"/>
                </svg>
                <div style={{ position: 'absolute', fontSize: 22, marginTop: 14 }}>
                  {m.icon}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: '#5D4037', textAlign: 'center', maxWidth: 80,
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