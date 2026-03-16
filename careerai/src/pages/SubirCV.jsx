import { useState, useRef } from 'react'
import { analizarCV } from '../lib/gemini.js'
import { jsPDF } from 'jspdf'

export default function SubirCV() {
  const [paso, setPaso] = useState('subir')
  const [archivo, setArchivo] = useState(null)
  const [oferta, setOferta] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const fileRef = useRef()

  const procesarArchivo = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Por favor sube un archivo PDF válido')
      return
    }
    setArchivo(file.name)
    setCargando(true)
    setPaso('analizando')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const texto = `Archivo PDF: ${file.name}. Por favor analiza esta hoja de vida y optimízala para ATS.`
      const res = await analizarCV(texto, oferta)
      setResultado(res || DEMO)
      setPaso('resultado')
      setCargando(false)
    }
    reader.readAsText(file)
  }

  const descargarPDF = () => {
    if (!resultado) return
    const d = resultado
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 61, 165)
    doc.text(d.nombre || 'Nombre', 20, y)
    y += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(d.cargo_objetivo || '', 20, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    const contacto = [d.email, d.telefono, d.ciudad].filter(Boolean).join('  |  ')
    doc.text(contacto, 20, y)
    y += 8

    doc.setDrawColor(57, 169, 0)
    doc.setLineWidth(0.8)
    doc.line(20, y, 190, y)
    y += 8

    if (d.perfil_profesional) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('PERFIL PROFESIONAL', 20, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(d.perfil_profesional, 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 6
    }

    if (d.experiencia?.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('EXPERIENCIA LABORAL', 20, y)
      y += 6
      d.experiencia.forEach(exp => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(exp.cargo, 20, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`${exp.empresa}  |  ${exp.periodo}`, 20, y)
        y += 5
        exp.logros?.forEach(logro => {
          doc.setTextColor(60, 60, 60)
          const lines = doc.splitTextToSize(`• ${logro}`, 165)
          doc.text(lines, 25, y)
          y += lines.length * 5
        })
        y += 4
      })
    }

    if (d.educacion?.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('EDUCACIÓN', 20, y)
      y += 6
      d.educacion.forEach(edu => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(edu.titulo, 20, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`${edu.institucion}  |  ${edu.periodo}`, 20, y)
        y += 8
      })
    }

    if (d.habilidades?.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('HABILIDADES', 20, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(d.habilidades.join(', '), 170)
      doc.text(lines, 20, y)
    }

    doc.save(`CV_ATS_${d.nombre || 'optimizado'}.pdf`)
  }

  const DEMO = {
    nombre: 'Tu Nombre Completo',
    cargo_objetivo: 'Profesional en tu área',
    email: 'tucorreo@email.com',
    telefono: '+57 300 000 0000',
    ciudad: 'Bogotá, Colombia',
    perfil_profesional: 'Profesional con experiencia comprobada. Especializado en habilidades clave con historial de resultados medibles.',
    experiencia: [{ cargo: 'Cargo Principal', empresa: 'Empresa S.A.', periodo: '2021-2024', logros: ['Logro importante con resultado medible', 'Optimicé proceso reduciendo tiempos en 30%'] }],
    educacion: [{ titulo: 'Tu Título', institucion: 'Universidad', periodo: '2017-2021' }],
    habilidades: ['Habilidad 1', 'Habilidad 2', 'Microsoft Office'],
    idiomas: [{ idioma: 'Español', nivel: 'Nativo' }],
    score_ats: 75,
    mejoras: ['Activa la IA para análisis real', 'Sube tu PDF y obtén resultados personalizados'],
  }

  if (paso === 'resultado' && resultado) {
    const d = resultado
    const sc = d.score_ats || 0
    const scColor = sc >= 80 ? 'var(--verde)' : sc >= 60 ? 'var(--naranja)' : '#ff4444'

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>📄 CV Optimizado para ATS</h1>
            <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Listo para enviar a empleadores</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPaso('subir'); setResultado(null); setArchivo(null) }} style={{ padding: '9px 16px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 9, color: 'var(--texto2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Subir otro
            </button>
            <button onClick={descargarPDF} style={{ padding: '9px 18px', background: 'var(--verde)', border: 'none', borderRadius: 9, color: 'var(--blanco)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ⬇ Descargar PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* CV Preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <div style={{ background: 'var(--blanco)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gris2)', maxWidth: 700 }}>
              <div style={{ background: 'var(--azul)', color: 'var(--blanco)', padding: '24px 28px' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{d.nombre}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '5px 0 10px' }}>{d.cargo_objetivo}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  {d.email && <span>✉ {d.email}</span>}
                  {d.telefono && <span>📱 {d.telefono}</span>}
                  {d.ciudad && <span>📍 {d.ciudad}</span>}
                </div>
              </div>
              <div style={{ padding: '20px 28px' }}>
                {d.perfil_profesional && (
                  <>
                    <STitle>Perfil Profesional</STitle>
                    <p style={{ fontSize: 12, lineHeight: 1.75, color: '#334155', marginBottom: 14 }}>{d.perfil_profesional}</p>
                  </>
                )}
                {d.experiencia?.length > 0 && (
                  <>
                    <STitle>Experiencia Laboral</STitle>
                    {d.experiencia.map((e, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{e.cargo}</div>
                        <div style={{ fontSize: 12, color: '#64748b', margin: '3px 0 5px' }}>{e.empresa} · {e.periodo}</div>
                        <ul style={{ paddingLeft: 16, margin: 0 }}>
                          {e.logros?.map((l, j) => <li key={j} style={{ fontSize: 12, color: '#334155', lineHeight: 1.65, marginBottom: 2 }}>{l}</li>)}
                        </ul>
                      </div>
                    ))}
                  </>
                )}
                {d.educacion?.length > 0 && (
                  <>
                    <STitle>Educación</STitle>
                    {d.educacion.map((e, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{e.titulo}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{e.institucion} · {e.periodo}</div>
                      </div>
                    ))}
                  </>
                )}
                {d.habilidades?.length > 0 && (
                  <>
                    <STitle>Habilidades</STitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {d.habilidades.map((s, i) => (
                        <span key={i} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: 4, fontSize: 11, color: '#334155' }}>{s}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel análisis */}
          <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--gris2)', padding: '20px 16px', overflowY: 'auto', background: 'var(--blanco)' }}>
            <div style={{ background: 'var(--gris)', border: `1px solid ${scColor}30`, borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Score ATS</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: scColor, lineHeight: 1 }}>{sc}</div>
              <div style={{ fontSize: 11, color: 'var(--texto2)', marginBottom: 10 }}>/100</div>
              <div style={{ height: 5, background: 'var(--gris2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sc}%`, background: scColor, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color: scColor, marginTop: 8, fontWeight: 700 }}>
                {sc >= 80 ? '✅ Excelente' : sc >= 60 ? '⚠️ Mejorable' : '❌ Requiere mejoras'}
              </div>
            </div>

            {d.mejoras?.length > 0 && (
              <div style={{ background: 'rgba(57,169,0,0.06)', border: '1px solid rgba(57,169,0,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>✅ Mejoras aplicadas</div>
                {d.mejoras.map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--texto2)', lineHeight: 1.6, marginBottom: 5, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--verde)' }}>•</span>{m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>📤 Subir CV y optimizar para ATS</h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Sube tu PDF y la IA lo optimiza automáticamente</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
              Oferta de trabajo (opcional)
            </label>
            <textarea
              value={oferta}
              onChange={e => setOferta(e.target.value)}
              placeholder="Pega aquí la descripción del cargo para personalizar el CV con palabras clave..."
              rows={3}
              style={{ width: '100%', padding: '10px 13px', background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 9, fontSize: 13, color: 'var(--texto)', resize: 'vertical', lineHeight: 1.6, marginBottom: 20 }}
            />
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={e => { e.preventDefault(); setArrastrando(false); procesarArchivo(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${arrastrando ? 'var(--verde)' : 'var(--gris2)'}`,
              borderRadius: 16, padding: '52px 32px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: arrastrando ? 'rgba(57,169,0,0.04)' : 'var(--blanco)',
            }}
          >
            {cargando ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--azul)', marginBottom: 6 }}>Analizando tu CV...</div>
                <div style={{ fontSize: 13, color: 'var(--texto2)' }}>La IA está optimizando tu hoja de vida</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 14 }}>📤</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--texto)', marginBottom: 6 }}>
                  {archivo || 'Arrastra tu PDF aquí o haz clic'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 20 }}>Solo archivos PDF</div>
                <div style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.2)', borderRadius: 9, color: 'var(--azul)', fontSize: 13, fontWeight: 700 }}>
                  Seleccionar PDF
                </div>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => procesarArchivo(e.target.files[0])} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
            {['Lee el PDF automáticamente', 'Optimiza palabras clave ATS', 'Genera formato profesional', 'Score ATS 0-100', 'Descarga en PDF'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--texto2)' }}>
                <span style={{ color: 'var(--verde)', fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function STitle({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1e293b', borderBottom: '1.5px solid #1e293b', paddingBottom: 3, marginBottom: 9, marginTop: 16 }}>{children}</div>
}