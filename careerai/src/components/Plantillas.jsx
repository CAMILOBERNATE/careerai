import { jsPDF } from 'jspdf'

export function descargarPDF(datos, plantilla = 'clasica') {
  const doc = new jsPDF()
  
  if (plantilla === 'clasica') plantillaClasica(doc, datos)
  if (plantilla === 'moderna') plantillaModerna(doc, datos)
  if (plantilla === 'minimalista') plantillaMinimalista(doc, datos)
  
  doc.save(`CV_${datos.nombre || 'MiCV'}.pdf`)
}

// ── PLANTILLA CLÁSICA ─────────────────────────────
function plantillaClasica(doc, d) {
  let y = 20

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 61, 165)
  doc.text(d.nombre || 'Nombre Completo', 105, y, { align: 'center' })
  y += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(d.cargo_objetivo || d.cargo || '', 105, y, { align: 'center' })
  y += 6

  doc.setFontSize(9)
  const contacto = [d.email, d.telefono, d.ciudad, d.linkedin].filter(Boolean).join('   |   ')
  doc.text(contacto, 105, y, { align: 'center' })
  y += 6

  doc.setDrawColor(0, 61, 165)
  doc.setLineWidth(1)
  doc.line(20, y, 190, y)
  y += 8

  y = agregarSecciones(doc, d, y, { titleColor: [0, 61, 165], lineColor: [0, 61, 165] })
}

// ── PLANTILLA MODERNA ─────────────────────────────
function plantillaModerna(doc, d) {
  // Cabecera verde
  doc.setFillColor(57, 169, 0)
  doc.rect(0, 0, 210, 45, 'F')

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(d.nombre || 'Nombre Completo', 20, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(220, 255, 220)
  doc.text(d.cargo_objetivo || d.cargo || '', 20, 30)

  doc.setFontSize(9)
  doc.setTextColor(200, 240, 200)
  const contacto = [d.email, d.telefono, d.ciudad].filter(Boolean).join('   |   ')
  doc.text(contacto, 20, 39)

  let y = 56
  doc.setDrawColor(57, 169, 0)
  doc.setLineWidth(0.5)

  y = agregarSecciones(doc, d, y, { titleColor: [57, 169, 0], lineColor: [57, 169, 0] })
}

// ── PLANTILLA MINIMALISTA ─────────────────────────
function plantillaMinimalista(doc, d) {
  let y = 25

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(d.nombre || 'Nombre Completo', 20, y)
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(d.cargo_objetivo || d.cargo || '', 20, y)
  y += 6

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  const contacto = [d.email, d.telefono, d.ciudad].filter(Boolean).join('   ·   ')
  doc.text(contacto, 20, y)
  y += 8

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(20, y, 190, y)
  y += 8

  y = agregarSecciones(doc, d, y, { titleColor: [30, 30, 30], lineColor: [200, 200, 200] })
}

// ── SECCIONES COMPARTIDAS ─────────────────────────
function agregarSecciones(doc, d, y, { titleColor, lineColor }) {
  const titulo = (texto) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...titleColor)
    doc.text(texto.toUpperCase(), 20, y)
    y += 2
    doc.setDrawColor(...lineColor)
    doc.setLineWidth(0.4)
    doc.line(20, y, 190, y)
    y += 5
  }

  const texto = (t, indent = 20) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(t, 190 - indent)
    doc.text(lines, indent, y)
    y += lines.length * 5
  }

  // Perfil
  const perfil = d.perfil_profesional || d.perfil
  if (perfil) {
    titulo('Perfil Profesional')
    texto(perfil)
    y += 4
  }

  // Experiencia
  const exp = d.experiencia
  if (exp?.length > 0 && (exp[0].cargo || exp[0].empresa)) {
    titulo('Experiencia Laboral')
    exp.forEach(e => {
      if (!e.cargo) return
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(e.cargo, 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`${e.empresa || ''}   |   ${e.periodo || ''}`, 20, y)
      y += 5
      const logros = Array.isArray(e.logros) ? e.logros.join('\n') : (e.logros || '')
      if (logros) {
        doc.setTextColor(60, 60, 60)
        const lines = doc.splitTextToSize(logros, 165)
        doc.text(lines, 25, y)
        y += lines.length * 5
      }
      y += 3
    })
    y += 2
  }

  // Educación
  const edu = d.educacion
  if (edu?.length > 0 && (edu[0].titulo || edu[0].institucion)) {
    titulo('Educación')
    edu.forEach(e => {
      if (!e.titulo) return
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(e.titulo, 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`${e.institucion || ''}   |   ${e.periodo || ''}`, 20, y)
      y += 8
    })
  }

  // Habilidades
  const habs = Array.isArray(d.habilidades) ? d.habilidades.join(', ') : (d.habilidades || '')
  if (habs) {
    titulo('Habilidades')
    texto(habs)
    y += 4
  }

  // Idiomas
  const idiomas = Array.isArray(d.idiomas)
    ? d.idiomas.map(i => `${i.idioma} — ${i.nivel}`).join('   |   ')
    : (d.idiomas || '')
  if (idiomas) {
    titulo('Idiomas')
    texto(idiomas)
  }

  return y
}