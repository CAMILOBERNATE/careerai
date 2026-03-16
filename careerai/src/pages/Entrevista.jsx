import { useState, useRef, useEffect } from 'react'
import { preguntarGemini } from '../lib/gemini.js'

const AREAS = [
  ['general', 'Cualquier cargo'],
  ['tech', 'Tecnología / Sistemas'],
  ['admin', 'Administración'],
  ['ventas', 'Ventas'],
  ['finanzas', 'Finanzas'],
  ['salud', 'Salud'],
  ['educacion', 'Educación'],
  ['marketing', 'Marketing'],
]

const NIVELES = [
  ['junior', 'Recién graduado'],
  ['mid', '1-3 años experiencia'],
  ['senior', 'Más de 3 años'],
]

const DIFICULTAD = [
  ['facil', 'Fácil'],
  ['media', 'Media'],
  ['dificil', 'Difícil'],
]

export default function Entrevista() {
  const [config, setConfig] = useState({ area: 'general', nivel: 'junior', dificultad: 'media' })
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [activa, setActiva] = useState(false)
  const [input, setInput] = useState('')
  const [preguntas, setPreguntas] = useState(0)
  const [puntuacion, setPuntuacion] = useState(null)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const iniciar = async () => {
    setMensajes([])
    setPuntuacion(null)
    setPreguntas(0)
    setActiva(true)
    setCargando(true)

    const inicio = [{
      role: 'user',
      text: `Inicia una entrevista laboral. Área: ${config.area}, nivel: ${config.nivel}, dificultad: ${config.dificultad}. 
      Saluda brevemente y haz la primera pregunta de entrevista.
      Después de cada respuesta mía, da feedback breve y haz la siguiente pregunta.
      Después de 5 preguntas da una evaluación final con puntuación X/10.
      Habla en español colombiano.`,
    }]

    const respuesta = await preguntarGemini(inicio)
    setMensajes([{ role: 'bot', text: respuesta }])
    setPreguntas(1)
    setCargando(false)
  }

  const enviar = async (texto) => {
    if (!texto.trim() || cargando) return
    const nuevosMensajes = [...mensajes, { role: 'user', text: texto }]
    setMensajes(nuevosMensajes)
    setInput('')
    setCargando(true)

    const respuesta = await preguntarGemini(nuevosMensajes)
    setMensajes([...nuevosMensajes, { role: 'bot', text: respuesta }])

    const match = respuesta.match(/(\d+(?:\.\d+)?)\s*\/\s*10/)
    if (match) setPuntuacion(match[1])
    setPreguntas(p => p + 1)
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
          🎯 Simular Entrevista
        </h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>
          La IA actúa como entrevistador y evalúa cada respuesta
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Config */}
        <div style={{
          width: 240,
          borderRight: '1px solid var(--gris2)',
          padding: '20px 16px',
          background: 'var(--blanco)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}>

          {/* Área */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
              Área
            </label>
            <select
              value={config.area}
              onChange={e => setConfig(c => ({ ...c, area: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}
            >
              {AREAS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>

          {/* Nivel */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
              Nivel
            </label>
            <select
              value={config.nivel}
              onChange={e => setConfig(c => ({ ...c, nivel: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}
            >
              {NIVELES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>

          {/* Dificultad */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
              Dificultad
            </label>
            <select
              value={config.dificultad}
              onChange={e => setConfig(c => ({ ...c, dificultad: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}
            >
              {DIFICULTAD.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>

          {/* Botón iniciar */}
          <button
            onClick={iniciar}
            disabled={cargando}
            style={{
              padding: '11px',
              background: 'var(--verde)',
              border: 'none',
              borderRadius: 10,
              color: 'var(--blanco)',
              fontWeight: 700,
              fontSize: 14,
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? '⏳ Cargando...' : '▶ Iniciar entrevista'}
          </button>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--gris)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--azul)' }}>{preguntas}</div>
              <div style={{ fontSize: 10, color: 'var(--texto2)', textTransform: 'uppercase' }}>Preguntas</div>
            </div>
            <div style={{ background: 'var(--gris)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: puntuacion && parseFloat(puntuacion) >= 7 ? 'var(--verde)' : 'var(--naranja)' }}>
                {puntuacion ? `${puntuacion}/10` : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--texto2)', textTransform: 'uppercase' }}>Puntuación</div>
            </div>
          </div>

          <div style={{ background: 'rgba(57,169,0,0.08)', border: '1px solid rgba(57,169,0,0.2)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--texto2)', lineHeight: 1.65 }}>
            💡 Usa el método <strong>STAR</strong> — Situación, Tarea, Acción, Resultado
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--gris)' }}>

            {mensajes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--texto2)' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--texto)' }}>
                  Configura tu entrevista
                </div>
                <div style={{ fontSize: 13 }}>
                  Selecciona el área, nivel y dificultad, luego presiona Iniciar
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  background: m.role === 'user' ? 'var(--azul)' : 'var(--naranja)',
                }}>
                  {m.role === 'user' ? '👤' : '🎙️'}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '11px 15px', borderRadius: 12,
                  fontSize: 14, lineHeight: 1.65,
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
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--naranja)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎙️</div>
                <div style={{ padding: '11px 15px', background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 12, borderTopLeftRadius: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--naranja)', display: 'inline-block', animation: `blink 1.2s ${i * 0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(input) }}}
              placeholder={activa ? 'Escribe tu respuesta...' : 'Primero inicia la entrevista...'}
              disabled={!activa || cargando}
              rows={1}
              style={{ flex: 1, background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 10, color: 'var(--texto)', fontSize: 14, padding: '10px 14px', resize: 'none', maxHeight: 120, lineHeight: 1.5 }}
            />
            <button
              onClick={() => enviar(input)}
              disabled={!activa || cargando || !input.trim()}
              style={{ width: 42, height: 42, background: !activa || cargando || !input.trim() ? 'var(--gris2)' : 'var(--naranja)', border: 'none', borderRadius: 10, cursor: !activa || cargando || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.2s' }}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}