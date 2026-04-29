import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY

// ─── Lee el PDF y lo envía a Gemini como documento base64 ────────────────────
async function analizarPDFConGemini(file, oferta) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]

      const prompt = `Eres un experto en hojas de vida y reclutamiento en Colombia. 
Analiza este PDF que es una hoja de vida del sistema de Red de Talentos del SENA / Agencia Pública de Empleo.

Extrae TODA la información disponible y genera una hoja de vida ATS optimizada y profesional.

${oferta ? `La persona aplica a esta oferta laboral, optimiza las palabras clave:\n${oferta}\n` : ''}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin texto adicional):
{
  "nombre": "nombre completo",
  "cargo_objetivo": "cargo o título profesional basado en su perfil",
  "email": "correo",
  "telefono": "teléfono",
  "ciudad": "ciudad",
  "cedula": "número de cédula si aparece",
  "fecha_nacimiento": "fecha si aparece",
  "perfil_profesional": "perfil ocupacional mejorado y optimizado para ATS, mínimo 3 oraciones profesionales",
  "experiencia": [
    {
      "cargo": "cargo desempeñado",
      "empresa": "nombre de la empresa",
      "ciudad": "ciudad/municipio",
      "periodo": "fecha inicio - fecha fin o Actual",
      "funciones": ["función 1", "función 2", "función 3"],
      "logros": ["logro cuantificable 1 si existe"]
    }
  ],
  "educacion": [
    {
      "titulo": "título obtenido",
      "institucion": "nombre institución",
      "periodo": "año o rango",
      "estado": "Graduado / En curso / etc"
    }
  ],
  "habilidades": ["habilidad 1", "habilidad 2"],
  "idiomas": [{"idioma": "nombre", "nivel": "nivel"}],
  "score_ats": 85,
  "mejoras": ["mejora aplicada 1", "mejora aplicada 2", "mejora aplicada 3"]
}`

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64
                    }
                  },
                  { text: prompt }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
              }
            })
          }
        )

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        resolve(parsed)
      } catch (err) {
        console.error('Error Gemini:', err)
        reject(err)
      }
    }
    reader.readAsDataURL(file)
  })
}

// ─── Generador PDF ATS ───────────────────────────────────────────────────────
function generarPDFATS(d) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 20

  const hexToRgb = hex => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]

  // ── Encabezado ──
  doc.setFillColor(0, 61, 165)
  doc.rect(0, 0, 210, 42, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(d.nombre || 'Nombre Completo', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 255)
  doc.text(d.cargo_objetivo || '', 14, 23)

  // Contacto en header
  doc.setFontSize(8)
  doc.setTextColor(180, 200, 255)
  const contactoItems = [
    d.email && `Email: ${d.email}`,
    d.telefono && `Tel: ${d.telefono}`,
    d.ciudad && `Ciudad: ${d.ciudad}`,
    d.cedula && `CC: ${d.cedula}`,
  ].filter(Boolean)

  let xc = 14
  contactoItems.forEach(c => {
    doc.text(c, xc, 30)
    xc += Math.min(doc.getTextWidth(c) + 8, 55)
    if (xc > 180) { xc = 14; y += 5 }
  })

  // Línea acento verde
  doc.setFillColor(57, 169, 0)
  doc.rect(0, 42, 210, 2, 'F')

  y = 52

  const sec = (titulo) => {
    if (y > 270) { doc.addPage(); y = 18 }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 61, 165)
    doc.text(titulo.toUpperCase(), 14, y)
    doc.setDrawColor(0, 61, 165)
    doc.setLineWidth(0.5)
    doc.line(14, y + 1.5, 196, y + 1.5)
    y += 7
  }

  const parrafo = (texto, x = 14, maxW = 182) => {
    if (!texto) return
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(texto, maxW)
    lines.forEach(l => {
      if (y > 278) { doc.addPage(); y = 18 }
      doc.text(l, x, y)
      y += 5
    })
  }

  // ── Perfil Ocupacional ──
  if (d.perfil_profesional) {
    sec('Perfil Ocupacional')
    parrafo(d.perfil_profesional)
    y += 3
  }

  // ── Experiencia ──
  if (d.experiencia?.length > 0) {
    sec('Experiencia Laboral')
    d.experiencia.forEach(exp => {
      if (y > 270) { doc.addPage(); y = 18 }

      // Cargo
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text(exp.cargo || '', 14, y)
      y += 5

      // Empresa | Periodo | Ciudad
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      const sublinea = [exp.empresa, exp.periodo, exp.ciudad].filter(Boolean).join('   ·   ')
      doc.text(sublinea, 14, y)
      y += 5

      // Funciones con viñetas
      if (exp.funciones?.length > 0) {
        exp.funciones.forEach(f => {
          if (y > 278) { doc.addPage(); y = 18 }
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(55, 55, 55)
          doc.setFillColor(0, 61, 165)
          doc.circle(17, y - 1, 0.8, 'F')
          const lines = doc.splitTextToSize(f, 174)
          lines.forEach(l => { doc.text(l, 20, y); y += 4.5 })
        })
      }

      // Logros en cursiva si existen
      if (exp.logros?.length > 0 && exp.logros[0]) {
        exp.logros.forEach(logro => {
          if (!logro || logro.includes('no tiene registrado')) return
          if (y > 278) { doc.addPage(); y = 18 }
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(70, 70, 70)
          doc.setFillColor(57, 169, 0)
          doc.circle(17, y - 1, 0.8, 'F')
          const lines = doc.splitTextToSize(logro, 174)
          lines.forEach(l => { doc.text(l, 20, y); y += 4.5 })
        })
      }

      y += 4
    })
  }

  // ── Educación ──
  if (d.educacion?.length > 0) {
    sec('Formación Académica')
    d.educacion.forEach(edu => {
      if (y > 275) { doc.addPage(); y = 18 }
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text(edu.titulo || '', 14, y)
      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      const sublinea = [edu.institucion, edu.periodo, edu.estado].filter(Boolean).join('   ·   ')
      doc.text(sublinea, 14, y)
      y += 7
    })
  }

  // ── Habilidades ──
  if (d.habilidades?.length > 0) {
    sec('Habilidades')
    const habs = d.habilidades
    let xh = 14
    const startY = y
    habs.forEach((h, i) => {
      const w = doc.getTextWidth(h) + 10
      if (xh + w > 190) { xh = 14; y += 9 }
      doc.setFillColor(235, 242, 255)
      doc.setDrawColor(0, 61, 165)
      doc.setLineWidth(0.3)
      doc.roundedRect(xh, y - 5, w, 7, 2, 2, 'FD')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 61, 165)
      doc.text(h, xh + 5, y)
      xh += w + 4
    })
    y += 10
  }

  // ── Idiomas ──
  if (d.idiomas?.length > 0) {
    sec('Idiomas')
    d.idiomas.forEach(id => {
      doc.setFontSize(9.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      doc.text(`${id.idioma}: ${id.nivel}`, 14, y)
      y += 5.5
    })
  }

  doc.save(`CV_ATS_${(d.nombre || 'optimizado').replace(/\s+/g, '_')}.pdf`)
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function SubirCV() {
  const [paso, setPaso] = useState('subir')
  const [archivo, setArchivo] = useState(null)
  const [oferta, setOferta] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState('')
  const [progresoMsg, setProgresoMsg] = useState('')
  const fileRef = useRef()

  const procesarArchivo = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Por favor sube un archivo PDF válido')
      return
    }
    setError('')
    setArchivo(file.name)
    setCargando(true)
    setPaso('analizando')

    const mensajes = [
      'Leyendo tu hoja de vida...',
      'Extrayendo información...',
      'Optimizando para ATS...',
      'Mejorando el perfil con IA...',
      'Generando tu nuevo CV...',
    ]
    let mi = 0
    setProgresoMsg(mensajes[0])
    const intervalo = setInterval(() => {
      mi = (mi + 1) % mensajes.length
      setProgresoMsg(mensajes[mi])
    }, 2500)

    try {
      const res = await analizarPDFConGemini(file, oferta)
      clearInterval(intervalo)
      setResultado(res)
      setPaso('resultado')
    } catch (err) {
      clearInterval(intervalo)
      setError('Error al analizar el PDF. Verifica tu conexión e intenta de nuevo.')
      setPaso('subir')
    } finally {
      setCargando(false)
    }
  }

  // ── Vista: analizando ─────────────────────────────────────────────────────
  if (paso === 'analizando') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gris)' }}>
        <div style={{ background: 'var(--blanco)', borderRadius: 20, padding: '48px 40px', textAlign: 'center', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--azul)', marginBottom: 8 }}>Analizando tu CV</h2>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 24 }}>{progresoMsg}</p>
          <div style={{ height: 4, background: 'var(--gris2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--azul)', borderRadius: 99, animation: 'progress 2.5s ease-in-out infinite' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 12 }}>Archivo: {archivo}</div>
          <style>{`@keyframes progress { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
        </div>
      </div>
    )
  }

  // ── Vista: resultado ──────────────────────────────────────────────────────
  if (paso === 'resultado' && resultado) {
    const d = resultado
    const sc = d.score_ats || 0
    const scColor = sc >= 80 ? 'var(--verde)' : sc >= 60 ? '#f59e0b' : '#ef4444'

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--azul)' }}>CV Optimizado para ATS</h1>
            <p style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 2 }}>Listo para enviar a empleadores · {d.nombre}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPaso('subir'); setResultado(null); setArchivo(null) }}
              style={{ padding: '8px 16px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, color: 'var(--texto2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Subir otro
            </button>
            <button onClick={() => generarPDFATS(d)}
              style={{ padding: '8px 18px', background: 'var(--verde)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ⬇ Descargar PDF ATS
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* CV Preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f1f5f9' }}>
            <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: 680, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {/* Encabezado CV */}
              <div style={{ background: '#003DA5', padding: '22px 26px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{d.nombre}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{d.cargo_objetivo}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  {d.email && <span>Email: {d.email}</span>}
                  {d.telefono && <span>Tel: {d.telefono}</span>}
                  {d.ciudad && <span>Ciudad: {d.ciudad}</span>}
                  {d.cedula && <span>CC: {d.cedula}</span>}
                </div>
              </div>
              <div style={{ height: 3, background: '#39A900' }} />

              <div style={{ padding: '18px 26px' }}>
                {/* Perfil */}
                {d.perfil_profesional && (
                  <div style={{ marginBottom: 16 }}>
                    <CVTitle>Perfil Ocupacional</CVTitle>
                    <p style={{ fontSize: 12, lineHeight: 1.75, color: '#334155' }}>{d.perfil_profesional}</p>
                  </div>
                )}

                {/* Experiencia */}
                {d.experiencia?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <CVTitle>Experiencia Laboral</CVTitle>
                    {d.experiencia.map((e, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{e.cargo}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 6px' }}>
                          {[e.empresa, e.periodo, e.ciudad].filter(Boolean).join('   ·   ')}
                        </div>
                        {e.funciones?.length > 0 && (
                          <ul style={{ paddingLeft: 0, margin: '0 0 4px', listStyle: 'none' }}>
                            {e.funciones.map((f, j) => (
                              <li key={j} style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 3, paddingLeft: 14, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 0, color: '#003DA5', fontWeight: 700 }}>•</span>{f}
                              </li>
                            ))}
                          </ul>
                        )}
                        {e.logros?.filter(l => l && !l.includes('no tiene registrado')).map((l, j) => (
                          <div key={j} style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', paddingLeft: 14, position: 'relative', marginBottom: 2 }}>
                            <span style={{ position: 'absolute', left: 0, color: '#39A900', fontWeight: 700 }}>•</span>{l}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Educación */}
                {d.educacion?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <CVTitle>Formación Académica</CVTitle>
                    {d.educacion.map((e, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{e.titulo}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {[e.institucion, e.periodo, e.estado].filter(Boolean).join('   ·   ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Habilidades */}
                {d.habilidades?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <CVTitle>Habilidades</CVTitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {d.habilidades.map((h, i) => (
                        <span key={i} style={{ background: '#EBF2FF', border: '1px solid #B8D0FF', color: '#003DA5', padding: '3px 10px', borderRadius: 4, fontSize: 11.5, fontWeight: 500 }}>{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Idiomas */}
                {d.idiomas?.length > 0 && (
                  <div>
                    <CVTitle>Idiomas</CVTitle>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {d.idiomas.map((id, i) => (
                        <span key={i} style={{ fontSize: 12, color: '#334155' }}><strong>{id.idioma}:</strong> {id.nivel}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel análisis */}
          <div style={{ width: 256, flexShrink: 0, borderLeft: '1px solid var(--gris2)', padding: '18px 14px', overflowY: 'auto', background: 'var(--blanco)' }}>
            {/* Score */}
            <div style={{ background: 'var(--gris)', border: `2px solid ${scColor}`, borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score ATS</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: scColor, lineHeight: 1 }}>{sc}</div>
              <div style={{ fontSize: 10, color: 'var(--texto2)', marginBottom: 10 }}>/100</div>
              <div style={{ height: 6, background: 'var(--gris2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sc}%`, background: scColor, borderRadius: 99, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: scColor, marginTop: 8, fontWeight: 700 }}>
                {sc >= 80 ? '✅ Excelente' : sc >= 60 ? '⚠️ Bueno' : '❌ Requiere mejoras'}
              </div>
            </div>

            {/* Info extraída */}
            <div style={{ background: 'var(--gris)', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--texto)', marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datos extraídos</div>
              {[
                ['Nombre', d.nombre],
                ['Cédula', d.cedula],
                ['Ciudad', d.ciudad],
                ['Exp. laboral', `${d.experiencia?.length || 0} cargo(s)`],
                ['Educación', `${d.educacion?.length || 0} título(s)`],
                ['Habilidades', `${d.habilidades?.length || 0} habilidades`],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 6 }}>
                  <span style={{ color: 'var(--texto2)', flexShrink: 0 }}>{k}:</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', color: 'var(--texto)', fontSize: 11 }}>{v}</span>
                </div>
              ) : null)}
            </div>

            {/* Mejoras */}
            {d.mejoras?.length > 0 && (
              <div style={{ background: 'rgba(57,169,0,0.06)', border: '1px solid rgba(57,169,0,0.25)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>✅ Mejoras aplicadas</div>
                {d.mejoras.map((m, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: 'var(--texto2)', lineHeight: 1.6, marginBottom: 5, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--verde)', fontWeight: 700 }}>•</span>{m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Vista: subir ──────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>Subir CV y optimizar para ATS</h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Sube tu PDF de Red de Talentos / SENA y la IA genera una hoja de vida profesional optimizada</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <div style={{ maxWidth: 620 }}>

          {/* Oferta laboral */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
              Oferta de trabajo (opcional — mejora las palabras clave)
            </label>
            <textarea
              value={oferta}
              onChange={e => setOferta(e.target.value)}
              placeholder="Pega aquí la descripción del cargo al que va a aplicar para personalizar el CV con las palabras clave exactas..."
              rows={3}
              style={{ width: '100%', padding: '10px 13px', background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 9, fontSize: 13, color: 'var(--texto)', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
            />
          </div>

          {/* Zona de carga */}
          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={e => { e.preventDefault(); setArrastrando(false); procesarArchivo(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${arrastrando ? 'var(--verde)' : error ? '#ef4444' : 'var(--gris2)'}`,
              borderRadius: 16, padding: '52px 32px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: arrastrando ? 'rgba(57,169,0,0.04)' : 'var(--blanco)',
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--texto)', marginBottom: 6 }}>
              {archivo || 'Arrastra tu PDF aquí o haz clic'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 20 }}>
              Formatos soportados: PDF de Red de Talentos, SENA, o cualquier hoja de vida en PDF
            </div>
            <div style={{ display: 'inline-block', padding: '10px 28px', background: 'var(--azul)', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700 }}>
              Seleccionar PDF
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => procesarArchivo(e.target.files[0])} />
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              ❌ {error}
            </div>
          )}

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
            {[
              ['📖', 'Lee el PDF automáticamente', 'Extrae toda la información del documento'],
              ['🎯', 'Optimiza palabras clave ATS', 'Mejora la visibilidad ante filtros automáticos'],
              ['✍️', 'Redacta el perfil con IA', 'Genera un perfil ocupacional profesional'],
              ['📊', 'Score ATS 0-100', 'Evalúa qué tan compatible es con sistemas ATS'],
              ['📋', 'Funciones en viñetas', 'Organiza la experiencia de forma clara y profesional'],
              ['⬇️', 'Descarga en PDF', 'Formato listo para enviar a cualquier empresa'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background: 'var(--gris)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--texto2)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CVTitle({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '1.5px', color: '#003DA5',
      borderBottom: '1.5px solid #003DA5',
      paddingBottom: 3, marginBottom: 9, marginTop: 16,
    }}>
      {children}
    </div>
  )
}