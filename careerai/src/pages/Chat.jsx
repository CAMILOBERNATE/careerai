import { useState, useRef, useEffect } from 'react'
import { preguntarGemini } from '../lib/gemini.js'

const RAPIDAS = [
  '¿Cómo me presento en una entrevista?',
  '¿Cómo negocio mi salario?',
  'Soy recién graduado ¿qué hago?',
  '¿Cómo explico un período sin trabajo?',
  '¿Cuántas páginas debe tener mi CV?',
  '¿Cómo optimizar mi LinkedIn?',
  '¿Qué preguntas le hago al entrevistador?',
  '¿Cómo manejar los nervios en una entrevista?',
]

export default function Chat() {
  const [mensajes, setMensajes] = useState([{
    role: 'bot',
    text: '¡Hola! 🐶 Soy tu asistente laboral del SENA. Puedo ayudarte con entrevistas, hojas de vida, salarios y cualquier duda de empleo. ¿En qué te ayudo hoy?',
  }])
  const [cargando, setCargando] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async (texto) => {
    if (!texto.trim() || cargando) return
    const nuevosMensajes = [...mensajes, { role: 'user', text: texto }]
    setMensajes(nuevosMensajes)
    setInput('')
    setCargando(true)
    const respuesta = await preguntarGemini(nuevosMensajes)
    setMensajes([...nuevosMensajes, { role: 'bot', text: respuesta }])
    setCargando(false)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '20px 32px',
        borderBottom: '1px solid var(--gris2)',
        background: 'var(--blanco)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>
          💬 Chat Laboral
        </h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>
          Solo respondo temas de empleo y carrera profesional
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Preguntas rápidas */}
        <div style={{
          width: 220,
          borderRight: '1px solid var(--gris2)',
          padding: '16px 10px',
          overflowY: 'auto',
          background: 'var(--blanco)',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--texto2)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '0 6px 8px',
          }}>
            Preguntas rápidas
          </div>
          {RAPIDAS.map((q, i) => (
            <button
              key={i}
              onClick={() => enviar(q)}
              disabled={cargando}
              style={{
                width: '100%',
                padding: '9px 11px',
                background: 'transparent',
                border: '1px solid var(--gris2)',
                borderRadius: 8,
                color: 'var(--texto2)',
                fontSize: 12,
                lineHeight: 1.5,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--verde)'
                e.currentTarget.style.color = 'var(--verde)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--gris2)'
                e.currentTarget.style.color = 'var(--texto2)'
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mensajes */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--gris)',
          }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  background: m.role === 'user' ? 'var(--azul)' : 'var(--verde)',
                }}>
                  {m.role === 'user' ? '👤' : '🐶'}
                </div>
                <div style={{
                  maxWidth: '75%',
                  padding: '11px 15px',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.65,
                  background: m.role === 'user' ? 'var(--azul)' : 'var(--blanco)',
                  color: m.role === 'user' ? 'var(--blanco)' : 'var(--texto)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--gris2)',
                  borderTopLeftRadius: m.role === 'user' ? 12 : 4,
                  borderTopRightRadius: m.role === 'user' ? 4 : 12,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {cargando && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--verde)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16,
                }}>🐶</div>
                <div style={{
                  padding: '11px 15px',
                  background: 'var(--blanco)',
                  border: '1px solid var(--gris2)',
                  borderRadius: 12,
                  borderTopLeftRadius: 4,
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7,
                      borderRadius: '50%',
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
            padding: '12px 16px',
            borderTop: '1px solid var(--gris2)',
            background: 'var(--blanco)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviar(input)
                }
              }}
              placeholder="Escribe tu pregunta laboral..."
              rows={1}
              style={{
                flex: 1,
                background: 'var(--gris)',
                border: '1px solid var(--gris2)',
                borderRadius: 10,
                color: 'var(--texto)',
                fontSize: 14,
                padding: '10px 14px',
                resize: 'none',
                maxHeight: 120,
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => enviar(input)}
              disabled={cargando || !input.trim()}
              style={{
                width: 42, height: 42,
                background: cargando || !input.trim() ? 'var(--gris2)' : 'var(--verde)',
                border: 'none',
                borderRadius: 10,
                cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'all 0.2s',
              }}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}