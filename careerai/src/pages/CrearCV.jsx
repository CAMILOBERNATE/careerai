import { useState } from 'react'
import { mejorarTexto } from '../lib/gemini.js'
import { jsPDF } from 'jspdf'

const INICIAL = {
  nombre: '', cargo: '', email: '', telefono: '', ciudad: '',
  linkedin: '', perfil: '', experiencia: [{ cargo: '', empresa: '', periodo: '', logros: '' }],
  educacion: [{ titulo: '', institucion: '', periodo: '' }],
  habilidades: '', idiomas: '',
}

export default function CrearCV() {
  const [datos, setDatos] = useState(INICIAL)
  const [mejorando, setMejorando] = useState({})
  const [vista, setVista] = useState('form')

  const actualizar = (campo, valor) => setDatos(d => ({ ...d, [campo]: valor }))

  const mejorar = async (campo, texto, tipo) => {
    if (!texto.trim()) return
    setMejorando(m => ({ ...m, [campo]: true }))
    const mejorado = await mejorarTexto(texto, tipo)
    actualizar(campo, mejorado)
    setMejorando(m => ({ ...m, [campo]: false }))
  }

  const agregarExp = () => setDatos(d => ({ ...d, experiencia: [...d.experiencia, { cargo: '', empresa: '', periodo: '', logros: '' }] }))
  const agregarEdu = () => setDatos(d => ({ ...d, educacion: [...d.educacion, { titulo: '', institucion: '', periodo: '' }] }))

  const actualizarExp = (i, campo, val) => {
    const exp = [...datos.experiencia]
    exp[i][campo] = val
    setDatos(d => ({ ...d, experiencia: exp }))
  }

  const actualizarEdu = (i, campo, val) => {
    const edu = [...datos.educacion]
    edu[i][campo] = val
    setDatos(d => ({ ...d, educacion: edu }))
  }

  const descargarPDF = () => {
    const doc = new jsPDF()
    let y = 20

    // Nombre
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 61, 165)
    doc.text(datos.nombre || 'Tu Nombre', 20, y)
    y += 8

    // Cargo
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(datos.cargo || '', 20, y)
    y += 6

    // Contacto
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    const contacto = [datos.email, datos.telefono, datos.ciudad, datos.linkedin].filter(Boolean).join('  |  ')
    doc.text(contacto, 20, y)
    y += 8

    // Línea
    doc.setDrawColor(57, 169, 0)
    doc.setLineWidth(0.8)
    doc.line(20, y, 190, y)
    y += 8

    // Perfil
    if (datos.perfil) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('PERFIL PROFESIONAL', 20, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const perfilLines = doc.splitTextToSize(datos.perfil, 170)
      doc.text(perfilLines, 20, y)
      y += perfilLines.length * 5 + 6
    }

    // Experiencia
    if (datos.experiencia[0].cargo) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('EXPERIENCIA LABORAL', 20, y)
      y += 6
      datos.experiencia.forEach(exp => {
        if (!exp.cargo) return
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(exp.cargo, 20, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`${exp.empresa}  |  ${exp.periodo}`, 20, y)
        y += 5
        if (exp.logros) {
          doc.setTextColor(60, 60, 60)
          const logrosLines = doc.splitTextToSize(exp.logros, 165)
          doc.text(logrosLines, 25, y)
          y += logrosLines.length * 5
        }
        y += 4
      })
    }

    // Educación
    if (datos.educacion[0].titulo) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('EDUCACIÓN', 20, y)
      y += 6
      datos.educacion.forEach(edu => {
        if (!edu.titulo) return
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

    // Habilidades
    if (datos.habilidades) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('HABILIDADES', 20, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const habLines = doc.splitTextToSize(datos.habilidades, 170)
      doc.text(habLines, 20, y)
      y += habLines.length * 5 + 6
    }

    // Idiomas
    if (datos.idiomas) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 61, 165)
      doc.text('IDIOMAS', 20, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(datos.idiomas, 20, y)
    }

    doc.save(`CV_${datos.nombre || 'MiCV'}.pdf`)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--gris)', border: '1px solid var(--gris2)',
    borderRadius: 8, fontSize: 13, color: 'var(--texto)',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--texto2)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    display: 'block', marginBottom: 5,
  }

  const seccionStyle = {
    background: 'var(--blanco)', border: '1px solid var(--gris2)',
    borderRadius: 14, padding: 22, marginBottom: 16,
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--gris2)',
        background: 'var(--blanco)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>📝 Crear CV desde cero</h1>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Llena tu información y la IA mejora cada sección automáticamente</p>
        </div>
        <button
          onClick={descargarPDF}
          style={{
            padding: '10px 20px', background: 'var(--verde)',
            border: 'none', borderRadius: 10, color: 'var(--blanco)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          ⬇ Descargar PDF
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', maxWidth: 720 }}>

        {/* Datos personales */}
        <div style={seccionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 16 }}>👤 Datos Personales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['nombre', 'Nombre completo'],
              ['cargo', 'Cargo objetivo'],
              ['email', 'Correo electrónico'],
              ['telefono', 'Teléfono'],
              ['ciudad', 'Ciudad'],
              ['linkedin', 'LinkedIn (opcional)'],
            ].map(([campo, label]) => (
              <div key={campo}>
                <label style={labelStyle}>{label}</label>
                <input
                  value={datos[campo]}
                  onChange={e => actualizar(campo, e.target.value)}
                  placeholder={label}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Perfil */}
        <div style={seccionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)' }}>📋 Perfil Profesional</h2>
            <button
              onClick={() => mejorar('perfil', datos.perfil, 'perfil profesional')}
              disabled={mejorando.perfil || !datos.perfil}
              style={{
                padding: '6px 12px', background: mejorando.perfil ? 'var(--gris2)' : 'rgba(57,169,0,0.1)',
                border: '1px solid rgba(57,169,0,0.3)', borderRadius: 7,
                color: 'var(--verde)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {mejorando.perfil ? '⏳ Mejorando...' : '✨ Mejorar con IA'}
            </button>
          </div>
          <textarea
            value={datos.perfil}
            onChange={e => actualizar('perfil', e.target.value)}
            placeholder="Escribe un resumen de tu perfil profesional..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Experiencia */}
        <div style={seccionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)' }}>💼 Experiencia Laboral</h2>
            <button onClick={agregarExp} style={{ padding: '6px 12px', background: 'rgba(0,61,165,0.1)', border: '1px solid rgba(0,61,165,0.3)', borderRadius: 7, color: 'var(--azul)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Agregar
            </button>
          </div>
          {datos.experiencia.map((exp, i) => (
            <div key={i} style={{ background: 'var(--gris)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[['cargo','Cargo'],['empresa','Empresa'],['periodo','Período']].map(([campo, label]) => (
                  <div key={campo}>
                    <label style={labelStyle}>{label}</label>
                    <input value={exp[campo]} onChange={e => actualizarExp(i, campo, e.target.value)} placeholder={label} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={labelStyle}>Logros y responsabilidades</label>
                <button
                  onClick={() => {
                    const expCopy = [...datos.experiencia]
                    mejorarTexto(exp.logros, 'logros laborales').then(m => {
                      expCopy[i].logros = m
                      setDatos(d => ({ ...d, experiencia: expCopy }))
                    })
                  }}
                  disabled={!exp.logros}
                  style={{ padding: '4px 10px', background: 'rgba(57,169,0,0.1)', border: '1px solid rgba(57,169,0,0.3)', borderRadius: 6, color: 'var(--verde)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✨ Mejorar
                </button>
              </div>
              <textarea value={exp.logros} onChange={e => actualizarExp(i, 'logros', e.target.value)} placeholder="Describe tus logros y responsabilidades..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          ))}
        </div>

        {/* Educación */}
        <div style={seccionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)' }}>🎓 Educación</h2>
            <button onClick={agregarEdu} style={{ padding: '6px 12px', background: 'rgba(0,61,165,0.1)', border: '1px solid rgba(0,61,165,0.3)', borderRadius: 7, color: 'var(--azul)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Agregar
            </button>
          </div>
          {datos.educacion.map((edu, i) => (
            <div key={i} style={{ background: 'var(--gris)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['titulo','Título'],['institucion','Institución'],['periodo','Período']].map(([campo, label]) => (
                  <div key={campo}>
                    <label style={labelStyle}>{label}</label>
                    <input value={edu[campo]} onChange={e => actualizarEdu(i, campo, e.target.value)} placeholder={label} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Habilidades e Idiomas */}
        <div style={seccionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 16 }}>🛠 Habilidades e Idiomas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Habilidades (separadas por comas)</label>
              <input value={datos.habilidades} onChange={e => actualizar('habilidades', e.target.value)} placeholder="Excel, Word, Trabajo en equipo, Liderazgo..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Idiomas</label>
              <input value={datos.idiomas} onChange={e => actualizar('idiomas', e.target.value)} placeholder="Español nativo, Inglés B2..." style={inputStyle} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}