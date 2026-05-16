import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY

// ─── EXTRACCIÓN CON GEMINI ────────────────────────────────────────────────────
async function extraerDatosAPE(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]

      const prompt = `Eres un experto en hojas de vida y reclutamiento en Colombia.
Este PDF es una hoja de vida generada por la APE (Agencia Pública de Empleo) del SENA.
Tiene secciones como: PERFIL OCUPACIONAL, LOGROS ALCANZADOS, FORMACIÓN ACADÉMICA, EXPERIENCIA LABORAL.
En experiencia laboral las funciones vienen con guiones (-).

Extrae TODA la información y responde ÚNICAMENTE con JSON válido sin markdown ni texto adicional:
{
  "nombre": "nombre completo en mayúsculas",
  "cargo": "cargo objetivo basado en perfil y experiencia",
  "email": "correo electrónico",
  "telefono": "celular principal",
  "ciudad": "ciudad de residencia",
  "direccion": "dirección completa",
  "cedula": "número de cédula",
  "perfil": "perfil ocupacional completo optimizado para ATS en tercera persona, mínimo 4 oraciones profesionales",
  "experiencia": [
    {
      "cargo": "cargo exacto",
      "empresa": "nombre empresa",
      "ciudad": "ciudad donde trabajó",
      "mesInicio": "02",
      "anioInicio": "2020",
      "mesFin": "12",
      "anioFin": "2022",
      "actual": false,
      "funciones": "función 1\nfunción 2\nfunción 3",
      "logros": ""
    }
  ],
  "educacion": [
    {
      "titulo": "título exacto",
      "institucion": "nombre institución",
      "ciudad": "",
      "mesInicio": "",
      "anioInicio": "2020",
      "mesFin": "",
      "anioFin": "2023",
      "actual": false
    }
  ],
  "cursos": [
    { "nombre": "nombre del curso", "institucion": "institución", "anio": "2022" }
  ],
  "habilidades": "habilidad1, habilidad2, habilidad3",
  "idiomas": "Español nativo",
  "fotoBase64": "",
  "score_ats": 80,
  "mejoras": ["mejora 1 aplicada", "mejora 2 aplicada", "mejora 3 aplicada"]
}

IMPORTANTE:
- Meses en formato "02" (dos dígitos)
- Si el trabajo es actual: actual:true y mesFin/anioFin vacíos
- Funciones separadas por salto de línea \\n
- Si no hay logros reales deja logros como ""
- Extrae TODAS las funciones que aparecen con guión (-)
- El perfil debe ser profesional, tercera persona, optimizado ATS`

      try {
        // Método 1: Enviar PDF como inline_data (Gemini 1.5)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: 'application/pdf', data: base64 } },
                  { text: prompt }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
            })
          }
        )

        if (!res.ok) {
          const errData = await res.json()
          console.error('Gemini API error:', errData)
          throw new Error(`API Error: ${res.status} - ${JSON.stringify(errData)}`)
        }

        const data = await res.json()
        console.log('Gemini response:', data)

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) throw new Error('Respuesta vacía de Gemini')

        // Limpiar y parsear JSON
        let clean = text.replace(/```json|```/g, '').trim()

        // Si el JSON está cortado, intentar cerrarlo
        try {
          const parsed = JSON.parse(clean)
          resolve(parsed)
        } catch(parseErr) {
          // Intentar reparar JSON cortado
          console.warn('JSON incompleto, intentando reparar...')
          // Contar llaves y corchetes abiertos
          let depth = 0, arrDepth = 0
          for (const ch of clean) {
            if (ch === '{') depth++
            else if (ch === '}') depth--
            else if (ch === '[') arrDepth++
            else if (ch === ']') arrDepth--
          }
          // Cerrar lo que falta
          let repaired = clean
          for (let i = 0; i < arrDepth; i++) repaired += ']'
          for (let i = 0; i < depth; i++) repaired += '}'
          try {
            const parsed = JSON.parse(repaired)
            resolve(parsed)
          } catch(e2) {
            throw new Error('No se pudo parsear la respuesta de Gemini')
          }
        }

      } catch (err) {
        console.error('Error completo:', err)
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const FUENTES = [
  { id: 'helvetica', nombre: 'Moderna',  css: 'Arial, sans-serif' },
  { id: 'times',     nombre: 'Elegante', css: 'Georgia, serif' },
  { id: 'courier',   nombre: 'Técnica',  css: '"Courier New", monospace' },
]

const COLORES = [
  '#003DA5','#1E8449','#2C3E50','#C0392B','#6C3483',
  '#784212','#154360','#117A65','#1A5276','#922B21','#555555','#B7950B',
]

const PLANTILLAS_INFO = [
  { id:'p1', nombre:'Formal Completa',  desc:'2 col · sidebar · sin foto',          color:'#003DA5' },
  { id:'p2', nombre:'Profesional',      desc:'1 col · con foto · habilidades 3 col', color:'#2C3E50' },
  { id:'p3', nombre:'Creativa Oscura',  desc:'2 col · sidebar oscuro · con foto',    color:'#1E8449' },
  { id:'p4', nombre:'Corporativa',      desc:'2 col · sidebar color · con foto',     color:'#154360' },
  { id:'p5', nombre:'Minimalista',      desc:'2 col · líneas suaves · con foto',     color:'#555555' },
  { id:'p6', nombre:'Ejecutiva',        desc:'1 col · foto circular · encabezado',   color:'#003DA5' },
  { id:'p7', nombre:'Premium',          desc:'2 col · fondo suave · con foto',       color:'#117A65' },
]

const hexToRgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]

const periodoStr = e => {
  const ini = e.mesInicio && e.anioInicio ? `${e.mesInicio}/${e.anioInicio}` : e.anioInicio || ''
  const fin = e.actual ? 'Actual' : (e.mesFin && e.anioFin ? `${e.mesFin}/${e.anioFin}` : e.anioFin || '')
  return ini && fin ? `${ini} - ${fin}` : ini || fin || ''
}

// ─── MINI PREVIEW ─────────────────────────────────────────────────────────────
function MiniPreview({ d, pid, color, fuente }) {
  const ff = FUENTES.find(f=>f.id===fuente)?.css || 'Arial, sans-serif'
  const cl = color + '20'
  const habs = typeof d.habilidades==='string' ? d.habilidades : (d.habilidades||[]).join(',')
  const tS = { fontSize:6.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`1px solid ${cl}`, paddingBottom:2, marginBottom:4, marginTop:6 }

  if (pid === 'p1') return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'7px 9px 5px', borderBottom:`2px solid ${color}` }}>
        <div style={{ fontSize:9, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:6, color, fontWeight:600, textTransform:'uppercase', marginTop:1 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:5, color:'#777', marginTop:2 }}>{d.email} {d.telefono&&` · ${d.telefono}`}</div>
      </div>
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:'0 0 60%', padding:'5px 7px', overflow:'hidden' }}>
          {d.perfil&&<><div style={tS}>Perfil Ocupacional</div><p style={{ fontSize:5.5, color:'#444', lineHeight:1.4 }}>{d.perfil.slice(0,180)}</p></>}
          {d.experiencia?.[0]?.cargo&&<><div style={tS}>Experiencia</div>{d.experiencia.slice(0,2).map((e,i)=><div key={i} style={{ marginBottom:4 }}><div style={{ fontSize:6, fontWeight:700, color:'#111' }}>{e.empresa}</div><div style={{ fontSize:5.5, fontStyle:'italic', color:'#777' }}>{e.cargo} · {periodoStr(e)}</div></div>)}</>}
          {d.educacion?.[0]?.titulo&&<><div style={tS}>Educación</div>{d.educacion.slice(0,2).map((e,i)=><div key={i} style={{ marginBottom:3 }}><div style={{ fontSize:6, fontWeight:700 }}>{e.titulo}</div><div style={{ fontSize:5.5, color:'#888' }}>{e.institucion}</div></div>)}</>}
        </div>
        <div style={{ flex:'0 0 40%', background:cl, padding:'5px 6px', overflow:'hidden' }}>
          {habs&&<><div style={tS}>Habilidades</div>{habs.split(',').slice(0,6).map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:5.5, color:'#333', marginBottom:1.5 }}>{h}</div>)}</>}
          {d.idiomas&&<><div style={tS}>Idiomas</div><div style={{ fontSize:5.5, color:'#333' }}>{typeof d.idiomas==='string'?d.idiomas:(d.idiomas||[]).join(', ')}</div></>}
        </div>
      </div>
    </div>
  )

  // Sidebar para las demás — SIN foto, SIN duplicados
  const isDark = pid==='p3'
  const bg = isDark ? '#2b2b2b' : color
  const habsArr = habs.split(',').slice(0,6).map(h=>h.trim()).filter(Boolean)
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', overflow:'hidden' }}>
      <div style={{ width:'32%', background:bg, padding:'7px 5px', display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:7,fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:2 }}>{d.nombre||'Nombre'}</div>
        <div style={{ fontSize:5.5,color:'rgba(255,255,255,0.7)',marginBottom:4 }}>{d.cargo||''}</div>
        <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.2)',paddingTop:4,marginBottom:4 }}>
          {d.telefono&&<div style={{ fontSize:5,color:'rgba(255,255,255,0.75)',marginBottom:1.5 }}>{d.telefono}</div>}
          {d.email&&<div style={{ fontSize:4.5,color:'rgba(255,255,255,0.7)',marginBottom:1.5,wordBreak:'break-all' }}>{d.email}</div>}
          {d.ciudad&&<div style={{ fontSize:5,color:'rgba(255,255,255,0.7)',marginBottom:3 }}>{d.ciudad}</div>}
        </div>
        {habsArr.length>0&&<>
          <div style={{ fontSize:5.5,fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',marginBottom:3 }}>Habilidades</div>
          {habsArr.map((h,i)=><div key={i} style={{ fontSize:5,color:'rgba(255,255,255,0.75)',marginBottom:1.5 }}>• {h}</div>)}
        </>}
        {d.idiomas&&<>
          <div style={{ fontSize:5.5,fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',marginTop:5,marginBottom:2 }}>Idiomas</div>
          <div style={{ fontSize:5,color:'rgba(255,255,255,0.75)' }}>{typeof d.idiomas==='string'?d.idiomas:(d.idiomas||[]).join(', ')}</div>
        </>}
        {(d.cursos||[]).filter(c=>c.nombre).slice(0,3).length>0&&<>
          <div style={{ fontSize:5.5,fontWeight:700,color:'rgba(255,255,255,0.8)',textTransform:'uppercase',marginTop:5,marginBottom:2 }}>Cursos</div>
          {(d.cursos||[]).filter(c=>c.nombre).slice(0,3).map((c,i)=><div key={i} style={{ fontSize:5,color:'rgba(255,255,255,0.75)',marginBottom:2 }}>{c.nombre}</div>)}
        </>}
      </div>
      <div style={{ flex:1, padding:'7px 8px', overflow:'hidden' }}>
        <div style={{ fontSize:9,fontWeight:900,color:'#111',lineHeight:1.1,marginBottom:2 }}>{d.nombre||'NOMBRE'}</div>
        <div style={{ fontSize:6,fontWeight:700,color,marginBottom:5 }}>{d.cargo||'Cargo'}</div>
        {d.perfil&&<><div style={tS}>Perfil</div><p style={{ fontSize:5.5,color:'#444',lineHeight:1.4 }}>{d.perfil.slice(0,150)}</p></>}
        {d.experiencia?.[0]?.cargo&&<><div style={tS}>Experiencia</div>{d.experiencia.slice(0,2).map((e,i)=><div key={i} style={{ marginBottom:4 }}><div style={{ fontSize:6,fontWeight:700,color:'#111' }}>{e.cargo}</div><div style={{ fontSize:5.5,color:'#888' }}>{e.empresa} · {periodoStr(e)}</div></div>)}</>}
        {d.educacion?.[0]?.titulo&&<><div style={tS}>Educación</div>{d.educacion.slice(0,2).map((e,i)=><div key={i} style={{ marginBottom:3 }}><div style={{ fontSize:6,fontWeight:700 }}>{e.titulo}</div><div style={{ fontSize:5.5,color:'#888' }}>{e.institucion}</div></div>)}</>}
      </div>
    </div>
  )
}

// ─── GENERADOR PDF ────────────────────────────────────────────────────────────
function generarPDF(datos, pid, color, fuente) {
  const doc = new jsPDF({ unit:'mm', format:'a4' })
  const [pr,pg,pb] = hexToRgb(color)
  const fn = fuente
  const d = {
    ...datos,
    habilidades: typeof datos.habilidades==='string' ? datos.habilidades : (datos.habilidades||[]).join(', '),
    idiomas: typeof datos.idiomas==='string' ? datos.idiomas : (datos.idiomas||[]).map(i=>i.idioma||i).join(', '),
  }
  const expV = (d.experiencia||[]).filter(e=>e.cargo)
  const eduV = (d.educacion||[]).filter(e=>e.titulo)
  const curV = (d.cursos||[]).filter(c=>c.nombre)

  const seccion = (t, x, y, w) => {
    doc.setFontSize(9); doc.setFont(fn,'bold'); doc.setTextColor(pr,pg,pb)
    doc.text(t.toUpperCase(), x, y); y+=2
    doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.4); doc.line(x,y,x+w,y); y+=6
    return y
  }

  if (pid==='p1') {
    // ── P1: 2 columnas, encabezado grande, sidebar azul claro ──
    doc.setFontSize(22); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20)
    doc.text((d.nombre||'NOMBRE').toUpperCase(), 14, 18)
    doc.setFontSize(9); doc.setFont(fn,'normal'); doc.setTextColor(pr,pg,pb)
    doc.text((d.cargo||'').toUpperCase(), 14, 25)
    doc.setFontSize(7.5); doc.setTextColor(80,80,80)
    const cs = [d.direccion, d.telefono&&`Tel: ${d.telefono}`, d.email].filter(Boolean).join('   -   ')
    if(cs) doc.text(cs, 14, 31)
    doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.8); doc.line(14,34,196,34)

    const xL=14, wL=116, xR=136, wR=56
    let yL=42, yR=42
    doc.setFillColor(pr,pg,pb); doc.setGState(doc.GState({opacity:0.07}))
    doc.rect(xR-4,34,wR+8,263,'F'); doc.setGState(doc.GState({opacity:1}))

    const sL = t => { if(yL>275){doc.addPage();yL=15}; doc.setFontSize(8); doc.setFont(fn,'bold'); doc.setTextColor(pr,pg,pb); doc.text(t.toUpperCase(),xL,yL); yL+=2; doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.3); doc.line(xL,yL,xL+wL,yL); yL+=5 }
    const sR = t => { if(yR>280)return; doc.setFontSize(8); doc.setFont(fn,'bold'); doc.setTextColor(pr,pg,pb); doc.text(t.toUpperCase(),xR,yR); yR+=2; doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.3); doc.line(xR,yR,xR+wR,yR); yR+=5 }
    const iR = t => { if(!t||yR>280)return; doc.setFontSize(7.5); doc.setFont(fn,'normal'); doc.setTextColor(40,40,40); doc.splitTextToSize(t,wR).forEach(l=>{if(yR<283){doc.text(l,xR,yR);yR+=4.5}}) }

    if(d.perfil){ sL('Perfil Ocupacional'); doc.setFontSize(8.5); doc.setFont(fn,'normal'); doc.setTextColor(60,60,60); doc.splitTextToSize(d.perfil,wL).forEach(l=>{if(yL>275){doc.addPage();yL=15}; doc.text(l,xL,yL); yL+=5}); yL+=3 }

    if(expV.length){ sL('Experiencia Laboral'); expV.forEach(e=>{
      if(yL>275){doc.addPage();yL=15}
      const p1=e.mesInicio&&e.anioInicio?`${e.mesInicio}/${e.anioInicio}`:'', p2=e.actual?'Actual':(e.mesFin&&e.anioFin?`${e.mesFin}/${e.anioFin}`:'')
      doc.setFontSize(7); doc.setFont(fn,'normal'); doc.setTextColor(pr,pg,pb)
      if(p1) doc.text(p1,xL,yL); if(p2) doc.text(p2,xL,yL+4); if(e.ciudad) doc.text(e.ciudad,xL,yL+8)
      doc.setFontSize(8.5); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20); doc.text(e.empresa||'',xL+30,yL); yL+=5
      doc.setFont(fn,'italic'); doc.setFontSize(8); doc.setTextColor(80,80,80); doc.text(e.cargo||'',xL+30,yL); yL+=5
      if(e.funciones) e.funciones.split('\n').filter(Boolean).forEach(f=>{
        if(yL>278){doc.addPage();yL=15}
        doc.setFontSize(8); doc.setFont(fn,'normal'); doc.setTextColor(60,60,60)
        doc.setFillColor(pr,pg,pb); doc.circle(xL+31,yL-1,0.9,'F')
        doc.splitTextToSize(f.replace(/^[-•]\s*/,''),wL-34).forEach(l=>{doc.text(l,xL+34,yL);yL+=4.5})
      })
      yL+=3
    })}

    if(eduV.length){ sL('Formación Académica'); eduV.forEach(e=>{
      if(yL>275){doc.addPage();yL=15}
      doc.setFontSize(7); doc.setFont(fn,'normal'); doc.setTextColor(pr,pg,pb)
      if(e.anioInicio) doc.text(e.anioInicio,xL,yL)
      doc.setFontSize(8.5); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20); doc.text(e.titulo||'',xL+30,yL); yL+=5
      doc.setFont(fn,'italic'); doc.setFontSize(8); doc.setTextColor(80,80,80)
      doc.text(`${e.institucion||''}${e.ciudad?' · '+e.ciudad:''}`,xL+30,yL); yL+=7
    })}

    if(d.habilidades){ sR('Habilidades'); d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{iR(h);yR+=0.5}); yR+=4 }
    if(d.idiomas){ sR('Idiomas'); d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{iR(h);yR+=0.5}); yR+=4 }
    if(curV.length){ sR('Cursos'); curV.forEach(c=>{
      if(yR>278)return
      doc.setFontSize(7.5); doc.setFont(fn,'bold'); doc.setTextColor(30,30,30)
      doc.splitTextToSize(c.nombre,wR).forEach(l=>{if(yR<280){doc.text(l,xR,yR);yR+=4}})
      if(c.institucion){doc.setFont(fn,'normal');doc.setFontSize(7);doc.setTextColor(90,90,90);doc.text(c.institucion,xR,yR);yR+=3.5}
      if(c.anio){doc.setFontSize(7);doc.setTextColor(130,130,130);doc.text(c.anio,xR,yR);yR+=3.5}
      yR+=2
    })}

  } else {
    // ── P2-P7: sidebar lateral ──
    const aL = pid==='p3'?64:pid==='p7'?62:60
    const xM = aL+7, wM = 210-aL-12
    const dark = pid==='p3'
    if(dark){doc.setFillColor(43,43,43)}else{doc.setFillColor(pr,pg,pb)}
    doc.rect(0,0,aL,297,'F')
    let yL=10
    const tC = dark?[200,200,200]:[255,255,255]
    doc.setFontSize(11); doc.setFont(fn,'bold'); doc.setTextColor(...tC)
    doc.splitTextToSize(d.nombre||'NOMBRE',aL-8).forEach(l=>{doc.text(l,5,yL);yL+=6})
    doc.setFontSize(8); doc.setFont(fn,'italic'); doc.text(d.cargo||'',5,yL); yL+=6
    doc.setDrawColor(...tC); doc.setLineWidth(0.3); doc.setGState(doc.GState({opacity:0.3})); doc.line(5,yL,aL-4,yL); doc.setGState(doc.GState({opacity:1})); yL+=5
    const sL2 = t => { if(yL>282)return; doc.setFontSize(7.5); doc.setFont(fn,'bold'); doc.setTextColor(...tC); doc.setGState(doc.GState({opacity:0.75})); doc.text(t.toUpperCase(),5,yL); doc.setGState(doc.GState({opacity:1})); yL+=2; doc.setDrawColor(...tC); doc.setLineWidth(0.3); doc.setGState(doc.GState({opacity:0.3})); doc.line(5,yL,aL-4,yL); doc.setGState(doc.GState({opacity:1})); yL+=4 }
    const iL2 = t => { if(!t||yL>282)return; doc.setFontSize(7.5); doc.setFont(fn,'normal'); doc.setTextColor(...tC); doc.setGState(doc.GState({opacity:0.85})); doc.splitTextToSize(t,aL-8).forEach(l=>{if(yL<283){doc.text(l,5,yL);yL+=4.5}}); doc.setGState(doc.GState({opacity:1})); yL+=1 }
    sL2('Contacto');
    [d.telefono&&`Tel: ${d.telefono}`, d.email, d.ciudad, d.direccion].filter(Boolean).forEach(iL2); yL+=3
    if(d.habilidades){ sL2('Habilidades'); d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{ if(dark){doc.setGState(doc.GState({opacity:0.15}));doc.setFillColor(255,255,255);doc.roundedRect(5,yL-3,aL-10,6,1,1,'F');doc.setGState(doc.GState({opacity:1}))}; iL2(h) }); yL+=2 }
    if(d.idiomas){ sL2('Idiomas'); d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).forEach(iL2); yL+=2 }
    if(curV.length){ sL2('Cursos'); curV.forEach(c=>{iL2(c.nombre);if(c.institucion)iL2(c.institucion);yL+=1}) }

    let yM=15
    doc.setFontSize(18); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20); doc.text(d.nombre||'NOMBRE',xM,yM); yM+=7
    doc.setFontSize(9); doc.setFont(fn,'bold'); doc.setTextColor(pr,pg,pb); doc.text(d.cargo||'',xM,yM); yM+=5
    doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.5); doc.line(xM,yM,196,yM); yM+=6
    if(d.perfil){ doc.setFontSize(9); doc.setFont(fn,'normal'); doc.setTextColor(60,60,60); doc.splitTextToSize(d.perfil,wM).forEach(l=>{doc.text(l,xM,yM);yM+=5}); yM+=3 }
    const sM = t => { if(yM>278){doc.addPage();yM=15}; doc.setFontSize(9); doc.setFont(fn,'bold'); doc.setTextColor(pr,pg,pb); doc.text(t.toUpperCase(),xM,yM); yM+=2; doc.setDrawColor(pr,pg,pb); doc.setLineWidth(0.4); doc.line(xM,yM,196,yM); yM+=6 }
    if(expV.length){ sM('Experiencia Laboral'); expV.forEach(e=>{
      if(yM>275){doc.addPage();yM=15}
      doc.setFontSize(9.5); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20); doc.text(e.cargo||'',xM,yM); yM+=5
      doc.setFont(fn,'italic'); doc.setFontSize(8.5); doc.setTextColor(pr,pg,pb); doc.text(`${e.empresa||''}${e.ciudad?' · '+e.ciudad:''}`,xM,yM); yM+=4
      doc.setFont(fn,'normal'); doc.setFontSize(7.5); doc.setTextColor(120,120,120); const p=periodoStr(e); if(p)doc.text(p,xM,yM); yM+=5
      if(e.funciones) e.funciones.split('\n').filter(Boolean).forEach(f=>{
        if(yM>278){doc.addPage();yM=15}
        doc.setFontSize(8.5); doc.setFont(fn,'normal'); doc.setTextColor(60,60,60)
        doc.setFillColor(pr,pg,pb); doc.circle(xM+1.5,yM-1,1,'F')
        doc.splitTextToSize(f.replace(/^[-•]\s*/,''),wM-6).forEach(l=>{doc.text(l,xM+5,yM);yM+=4.5})
      })
      yM+=3
    })}
    if(eduV.length){ sM('Formación Académica'); eduV.forEach(e=>{
      if(yM>275){doc.addPage();yM=15}
      doc.setFontSize(9.5); doc.setFont(fn,'bold'); doc.setTextColor(20,20,20); doc.text(e.titulo||'',xM,yM); yM+=5
      doc.setFont(fn,'normal'); doc.setFontSize(8.5); doc.setTextColor(pr,pg,pb); doc.text(`${e.institucion||''}${e.ciudad?' · '+e.ciudad:''}`,xM,yM); yM+=4
      doc.setFontSize(7.5); doc.setTextColor(120,120,120); const p=periodoStr(e); if(p)doc.text(p,xM,yM); yM+=7
    })}
    if(curV.length){ sM('Cursos'); curV.forEach(c=>{doc.setFontSize(8.5);doc.setFont(fn,'normal');doc.setTextColor(50,50,50);doc.text(`${c.nombre}${c.institucion?' - '+c.institucion:''}${c.anio?' ('+c.anio+')':''}`,xM,yM);yM+=5.5}) }
  }

  doc.save(`CV_ATS_${(d.nombre||'CV').replace(/\s+/g,'_')}.pdf`)
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function SubirCV() {
  const [paso, setPaso] = useState('subir')
  const [archivo, setArchivo] = useState(null)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState('')
  const [progresoMsg, setProgresoMsg] = useState('')
  const [config, setConfig] = useState({ plantillaId:'p1', color:'#003DA5', fuente:'helvetica' })
  const fileRef = useRef()

  const actCfg = (k,v) => setConfig(c=>({...c,[k]:v}))

  const procesarArchivo = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Por favor sube un archivo PDF válido')
      return
    }
    setError('')
    setArchivo(file.name)
    setCargando(true)
    setPaso('analizando')

    const msgs = ['Leyendo tu hoja de vida...','Extrayendo información...','Optimizando para ATS...','Mejorando el perfil con IA...','Generando tu nuevo CV...']
    let mi = 0
    setProgresoMsg(msgs[0])
    const iv = setInterval(()=>{ mi=(mi+1)%msgs.length; setProgresoMsg(msgs[mi]) }, 2500)

    try {
      const res = await extraerDatosAPE(file)
      clearInterval(iv)
      setDatos(res)
      // Ajustar color de plantilla según lo extraído
      const plt = PLANTILLAS_INFO[0]
      setConfig(c=>({...c, color: plt.color}))
      setPaso('plantilla')
    } catch (err) {
      clearInterval(iv)
      console.error(err)
      setError(`Error al analizar: ${err.message}. Verifica que VITE_GEMINI_KEY esté correcta en .env`)
      setPaso('subir')
    } finally {
      setCargando(false)
    }
  }

  // ── PANTALLA: Analizando ───────────────────────────────────────────────────
  if (paso === 'analizando') return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gris)' }}>
      <div style={{ background:'var(--blanco)', borderRadius:20, padding:'48px 40px', textAlign:'center', maxWidth:380, boxShadow:'0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:52, marginBottom:14 }}>🤖</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:'var(--azul)', marginBottom:8 }}>Analizando con IA</h2>
        <p style={{ fontSize:13, color:'var(--texto2)', marginBottom:24 }}>{progresoMsg}</p>
        <div style={{ height:4, background:'var(--gris2)', borderRadius:99, overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', background:'var(--azul)', borderRadius:99, animation:'prog 2.5s ease-in-out infinite' }}/>
        </div>
        <div style={{ fontSize:12, color:'var(--texto2)' }}>📄 {archivo}</div>
        <style>{`@keyframes prog{0%{width:5%}60%{width:85%}100%{width:100%}}`}</style>
      </div>
    </div>
  )

  // ── PANTALLA: Escoger plantilla + preview ──────────────────────────────────
  if (paso === 'plantilla' && datos) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:800, color:'var(--azul)' }}>Datos extraídos · Escoge tu plantilla</h1>
          <p style={{ fontSize:12, color:'var(--texto2)', marginTop:2 }}>✅ {datos.nombre} · {(datos.experiencia||[]).length} experiencia(s) · {(datos.educacion||[]).length} título(s)</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>{setPaso('subir');setDatos(null);setArchivo(null)}}
            style={{ padding:'7px 14px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:8, color:'var(--texto2)', fontSize:12, cursor:'pointer' }}>
            ← Subir otro
          </button>
          <button onClick={()=>generarPDF(datos, config.plantillaId, config.color, config.fuente)}
            style={{ padding:'7px 18px', background:'var(--verde)', border:'none', borderRadius:8, color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            ⬇ Descargar PDF
          </button>
        </div>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'340px 1fr', overflow:'hidden' }}>
        {/* Panel izquierdo: controles */}
        <div style={{ overflowY:'auto', borderRight:'1px solid var(--gris2)', padding:'16px', background:'var(--gris)' }}>

          {/* Plantillas */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Plantilla</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
            {PLANTILLAS_INFO.map(p=>(
              <div key={p.id} onClick={()=>actCfg('plantillaId',p.id)}
                style={{ border:`2px solid ${config.plantillaId===p.id?'var(--azul)':'var(--gris2)'}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', boxShadow:config.plantillaId===p.id?'0 4px 14px rgba(0,61,165,0.15)':'none' }}>
                <div style={{ height:70, background:'#f5f5f5', overflow:'hidden', position:'relative' }}>
                  <div style={{ transform:'scale(0.25)', transformOrigin:'top left', width:'400%', height:'400%', pointerEvents:'none' }}>
                    <MiniPreview d={datos} pid={p.id} color={p.color} fuente={config.fuente}/>
                  </div>
                </div>
                <div style={{ padding:'6px 8px', background:config.plantillaId===p.id?'rgba(0,61,165,0.06)':'var(--blanco)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:config.plantillaId===p.id?'var(--azul)':'var(--texto)' }}>{p.nombre}</div>
                  <div style={{ fontSize:9.5, color:'var(--texto2)' }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Color */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Color</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {COLORES.map(c=>(
              <div key={c} onClick={()=>actCfg('color',c)}
                style={{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s' }}/>
            ))}
            <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)}
              style={{ width:26, height:26, border:'1px solid var(--gris2)', borderRadius:6, cursor:'pointer', padding:1 }}/>
          </div>

          {/* Fuente */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Tipo de letra</div>
          <div style={{ display:'flex', gap:6, marginBottom:18 }}>
            {FUENTES.map(f=>(
              <div key={f.id} onClick={()=>actCfg('fuente',f.id)}
                style={{ flex:1, padding:'7px 8px', borderRadius:8, border:`1.5px solid ${config.fuente===f.id?'var(--azul)':'var(--gris2)'}`, background:config.fuente===f.id?'rgba(0,61,165,0.05)':'var(--blanco)', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontFamily:f.css, fontSize:13, fontWeight:600, color:config.fuente===f.id?'var(--azul)':'var(--texto)' }}>{f.nombre}</div>
                <div style={{ fontFamily:f.css, fontSize:10, color:'var(--texto2)' }}>Aa 123</div>
              </div>
            ))}
          </div>

          {/* Score y mejoras */}
          {datos.score_ats && (
            <div style={{ background:'var(--blanco)', border:'1px solid var(--gris2)', borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Score ATS</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:32, fontWeight:900, color:datos.score_ats>=80?'var(--verde)':datos.score_ats>=60?'#f59e0b':'#ef4444' }}>{datos.score_ats}</div>
                <div style={{ flex:1 }}>
                  <div style={{ height:6, background:'var(--gris2)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${datos.score_ats}%`, background:datos.score_ats>=80?'var(--verde)':datos.score_ats>=60?'#f59e0b':'#ef4444', borderRadius:99 }}/>
                  </div>
                  <div style={{ fontSize:10, color:'var(--texto2)', marginTop:3 }}>/100 — {datos.score_ats>=80?'Excelente':datos.score_ats>=60?'Bueno':'Mejorable'}</div>
                </div>
              </div>
              {datos.mejoras?.length>0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--verde)', marginBottom:5 }}>✅ Mejoras aplicadas</div>
                  {datos.mejoras.map((m,i)=><div key={i} style={{ fontSize:11, color:'var(--texto2)', marginBottom:3, paddingLeft:10, position:'relative' }}><span style={{ position:'absolute', left:0, color:'var(--verde)' }}>•</span>{m}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Datos extraídos */}
          <div style={{ background:'var(--blanco)', border:'1px solid var(--gris2)', borderRadius:12, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Datos extraídos</div>
            {[['Nombre',datos.nombre],['Cédula',datos.cedula],['Teléfono',datos.telefono],['Ciudad',datos.ciudad],['Exp.',`${(datos.experiencia||[]).length} cargo(s)`],['Educación',`${(datos.educacion||[]).length} título(s)`]].map(([k,v])=>v?(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                <span style={{ color:'var(--texto2)' }}>{k}:</span>
                <span style={{ fontWeight:600, color:'var(--texto)', textAlign:'right', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
              </div>
            ):null)}
          </div>
        </div>

        {/* Preview en tiempo real */}
        <div style={{ background:'#e0e0e0', display:'flex', alignItems:'flex-start', justifyContent:'center', overflow:'auto', padding:'24px' }}>
          <div style={{ width:595, minHeight:842, background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.2)', borderRadius:3, overflow:'hidden' }}>
            <MiniPreview d={datos} pid={config.plantillaId} color={config.color} fuente={config.fuente}/>
          </div>
        </div>
      </div>
    </div>
  )

  // ── PANTALLA: Subir ────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--azul)' }}>Subir CV y generar ATS profesional</h1>
        <p style={{ fontSize:13, color:'var(--texto2)', marginTop:3 }}>Sube el PDF de la APE y la IA genera una hoja de vida bonita con tus plantillas</p>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'32px 40px' }}>
        <div style={{ maxWidth:580 }}>

          <div
            onDragOver={e=>{e.preventDefault();setArrastrando(true)}}
            onDragLeave={()=>setArrastrando(false)}
            onDrop={e=>{e.preventDefault();setArrastrando(false);procesarArchivo(e.dataTransfer.files[0])}}
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${arrastrando?'var(--verde)':error?'#ef4444':'var(--gris2)'}`, borderRadius:16, padding:'52px 32px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:arrastrando?'rgba(57,169,0,0.04)':'var(--blanco)', marginBottom:16 }}
          >
            <div style={{ fontSize:52, marginBottom:14 }}>📄</div>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--texto)', marginBottom:6 }}>
              {archivo||'Arrastra el PDF de la APE aquí o haz clic'}
            </div>
            <div style={{ fontSize:13, color:'var(--texto2)', marginBottom:20 }}>
              Solo archivos PDF — Hoja de vida de la Agencia Pública de Empleo
            </div>
            <div style={{ display:'inline-block', padding:'10px 28px', background:'var(--azul)', borderRadius:9, color:'white', fontSize:13, fontWeight:700 }}>
              Seleccionar PDF
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>procesarArchivo(e.target.files[0])}/>
          </div>

          {error && (
            <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:16 }}>
              ❌ {error}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['📖','Lee el PDF de la APE','Extrae automáticamente toda la información'],
              ['🎯','Optimiza para ATS','Mejora palabras clave y perfil profesional'],
              ['🎨','Escoge la plantilla','7 diseños bonitos con tu color preferido'],
              ['⬇️','Descarga el PDF','Listo para enviar a cualquier empresa'],
            ].map(([ic,t,d])=>(
              <div key={t} style={{ background:'var(--gris)', borderRadius:10, padding:'12px 14px', display:'flex', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ic}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:2 }}>{t}</div>
                  <div style={{ fontSize:11, color:'var(--texto2)', lineHeight:1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}