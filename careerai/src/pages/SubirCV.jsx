import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY

// ─── EXTRACCIÓN CON GEMINI ────────────────────────────────────────────────────
async function extraerDatosAPE(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      const prompt = `Eres un experto en hojas de vida ATS en Colombia.
Este PDF es una hoja de vida de la APE/SENA. Extrae la información y responde SOLO con JSON válido sin markdown:
{
  "nombre": "NOMBRE COMPLETO",
  "cargo": "cargo objetivo según perfil",
  "email": "correo",
  "telefono": "celular",
  "ciudad": "ciudad",
  "direccion": "dirección",
  "cedula": "cédula",
  "perfil": "perfil ocupacional mejorado para ATS en tercera persona, mínimo 3 oraciones",
  "experiencia": [
    {
      "cargo": "cargo",
      "empresa": "empresa",
      "ciudad": "ciudad",
      "mesInicio": "02",
      "anioInicio": "2020",
      "mesFin": "12",
      "anioFin": "2022",
      "actual": false,
      "funciones": "función 1\nfunción 2\nfunción 3"
    }
  ],
  "educacion": [
    {
      "titulo": "título",
      "institucion": "institución",
      "anioInicio": "2018",
      "anioFin": "2022",
      "actual": false
    }
  ],
  "cursos": [
    { "nombre": "nombre curso", "institucion": "institución", "anio": "2022" }
  ],
  "habilidades": ["habilidad1", "habilidad2", "habilidad3", "habilidad4", "habilidad5", "habilidad6"],
  "idiomas": "Español nativo",
  "score_ats": 80,
  "mejoras": ["mejora 1", "mejora 2", "mejora 3"]
}
REGLAS:
- habilidades: máximo 6, las más relevantes
- funciones separadas por \\n
- NO incluir foto
- Si no hay cursos, dejar cursos como []
- Si no hay logros reales no los inventes`

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [
                { inline_data: { mime_type: 'application/pdf', data: base64 } },
                { text: prompt }
              ]}],
              generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
            })
          }
        )
        if (!res.ok) {
          const err = await res.json()
          throw new Error(`API Error: ${res.status} - ${JSON.stringify(err)}`)
        }
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) throw new Error('Respuesta vacía de Gemini')
        let clean = text.replace(/```json|```/g, '').trim()
        try {
          console.log("JSON antes de parsear:", clean)   // 👈 Log clave
          resolve(JSON.parse(clean))
        } catch {
          // Reparar JSON cortado
          let depth = 0, arr = 0
          for (const ch of clean) {
            if (ch==='{') depth++; else if (ch==='}') depth--
            else if (ch==='[') arr++; else if (ch===']') arr--
          }
          for (let i=0;i<arr;i++) clean+=']'
          for (let i=0;i<depth;i++) clean+='}'
          console.log("JSON reparado antes de parsear:", clean)  // 👈 Log de respaldo
          resolve(JSON.parse(clean))
        }
      } catch(err) {
        console.error('Error completo:', err)
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const per = e => {
  const ini = e.mesInicio && e.anioInicio ? `${e.mesInicio}/${e.anioInicio}` : e.anioInicio||''
  const fin = e.actual ? 'Actualidad' : (e.mesFin && e.anioFin ? `${e.mesFin}/${e.anioFin}` : e.anioFin||'')
  return ini && fin ? `${ini} – ${fin}` : ini||fin||''
}

const habs6 = (h) => {
  if (!h) return []
  if (Array.isArray(h)) return h.slice(0,6)
  return h.split(',').map(x=>x.trim()).filter(Boolean).slice(0,6)
}

// ─── PLANTILLAS (PREVIEWS) ────────────────────────────────────────────────────

// P1 — FORMAL: 2 columnas, encabezado azul, sidebar derecho
function P1({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Arial, sans-serif', background:'#fff', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:color, padding:'18px 22px', color:'#fff' }}>
        <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3, opacity:0.85 }}>{d.cargo||'Cargo Profesional'}</div>
        <div style={{ fontSize:8.5, marginTop:6, opacity:0.75, display:'flex', gap:14, flexWrap:'wrap' }}>
          {d.email&&<span>✉ {d.email}</span>}
          {d.telefono&&<span>📞 {d.telefono}</span>}
          {d.ciudad&&<span>📍 {d.ciudad}</span>}
        </div>
      </div>
      {/* Línea acento */}
      <div style={{ height:3, background:color, opacity:0.2 }}/>
      {/* Cuerpo 2 columnas */}
      <div style={{ flex:1, display:'flex' }}>
        {/* Main izquierda */}
        <div style={{ flex:'0 0 62%', padding:'14px 16px 14px 22px', borderRight:`1px solid ${color}22` }}>
          {d.perfil && <Section color={color} title="Perfil Ocupacional"><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></Section>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
            <Section color={color} title="Experiencia Laboral">
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:9, color:color, fontWeight:600 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                  <div style={{ fontSize:8, color:'#888', marginBottom:4 }}>{per(e)}</div>
                  {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                    <div key={j} style={{ fontSize:8.5, color:'#444', display:'flex', gap:5, marginBottom:2 }}>
                      <span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}
                    </div>
                  ))}
                </div>
              ))}
            </Section>
          )}
          {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
            <Section color={color} title="Formación Académica">
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                  <div style={{ fontSize:9, color:'#666' }}>{e.institucion}</div>
                  <div style={{ fontSize:8, color:'#aaa' }}>{per(e)}</div>
                </div>
              ))}
            </Section>
          )}
        </div>
        {/* Sidebar derecha */}
        <div style={{ flex:'0 0 38%', padding:'14px 16px', background:`${color}08` }}>
          {habilidades.length>0 && (
            <Section color={color} title="Habilidades">
              {habilidades.map((h,i)=>(
                <div key={i} style={{ marginBottom:5 }}>
                  <div style={{ fontSize:8.5, color:'#333', marginBottom:2 }}>{h}</div>
                  <div style={{ height:4, background:'#e0e0e0', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${85-(i*8)}%`, background:color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </Section>
          )}
          {d.idiomas && (
            <Section color={color} title="Idiomas">
              <div style={{ fontSize:8.5, color:'#333' }}>{d.idiomas}</div>
            </Section>
          )}
          {cursos.length>0 && (
            <Section color={color} title="Cursos">
              {cursos.map((c,i)=>(
                <div key={i} style={{ marginBottom:6 }}>
                  <div style={{ fontSize:8.5, fontWeight:700, color:'#222' }}>{c.nombre}</div>
                  {c.institucion&&<div style={{ fontSize:8, color:'#666' }}>{c.institucion}</div>}
                  {c.anio&&<div style={{ fontSize:7.5, color:'#aaa' }}>{c.anio}</div>}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

// P2 — PROFESIONAL: 1 columna centrada, línea bajo nombre
function P2({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Georgia, serif', background:'#fff', padding:'24px 32px' }}>
      {/* Header centrado */}
      <div style={{ textAlign:'center', marginBottom:16, borderBottom:`2px solid ${color}`, paddingBottom:12 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#111', letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:11, color:color, fontWeight:600, marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase' }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:9, color:'#777', marginTop:6, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
        </div>
      </div>
      {/* Habilidades en chips */}
      {habilidades.length>0 && (
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Habilidades</STitle>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {habilidades.map((h,i)=>(
              <span key={i} style={{ padding:'4px 12px', background:`${color}15`, border:`1px solid ${color}40`, borderRadius:20, fontSize:9, color:color, fontWeight:600 }}>{h}</span>
            ))}
          </div>
        </div>
      )}
      {d.perfil && <div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
      {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Experiencia Laboral</STitle>
          {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
            <div key={i} style={{ marginBottom:12, paddingLeft:12, borderLeft:`2px solid ${color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{e.cargo}</div>
              <div style={{ fontSize:9.5, color:color }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`} <span style={{ color:'#aaa', fontStyle:'italic' }}>{per(e)}</span></div>
              {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                <div key={j} style={{ fontSize:9, color:'#555', marginTop:3, paddingLeft:8 }}>– {f.replace(/^[-•]\s*/,'')}</div>
              ))}
            </div>
          ))}
        </div>
      )}
      {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Formación Académica</STitle>
          {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'flex-start' }}>
              <div><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:9, color:'#666' }}>{e.institucion}</div></div>
              <div style={{ fontSize:8.5, color:'#aaa', textAlign:'right', flexShrink:0 }}>{per(e)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:24 }}>
        {d.idiomas && <div style={{ flex:1 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
        {cursos.length>0 && (
          <div style={{ flex:2 }}>
            <STitle color={color}>Cursos</STitle>
            {cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.institucion&&` — ${c.institucion}`}{c.anio&&` (${c.anio})`}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

// P3 — CREATIVA: sidebar oscuro izquierda, contenido derecha
function P3({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Arial, sans-serif', background:'#fff', display:'flex' }}>
      {/* Sidebar oscuro */}
      <div style={{ width:'34%', background:'#1e1e2e', padding:'22px 14px', display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:900, color:'#fff', lineHeight:1.2 }}>{d.nombre||'NOMBRE'}</div>
          <div style={{ fontSize:8.5, color:color, fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{d.cargo||''}</div>
        </div>
        <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
          <div style={{ fontSize:8, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Contacto</div>
          {d.email&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.email}</div>}
          {d.telefono&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.telefono}</div>}
          {d.ciudad&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.ciudad}</div>}
        </div>
        {habilidades.length>0 && (
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Habilidades</div>
            {habilidades.map((h,i)=>(
              <div key={i} style={{ marginBottom:6 }}>
                <div style={{ fontSize:7.5, color:'rgba(255,255,255,0.8)', marginBottom:2 }}>{h}</div>
                <div style={{ height:3, background:'rgba(255,255,255,0.1)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${80-(i*8)}%`, background:color, borderRadius:2 }}/>
                </div>
              </div>
            ))}
          </div>
        )}
        {d.idiomas && (
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Idiomas</div>
            <div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)' }}>{d.idiomas}</div>
          </div>
        )}
        {cursos.length>0 && (
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Cursos</div>
            {cursos.map((c,i)=>(
              <div key={i} style={{ marginBottom:6 }}>
                <div style={{ fontSize:7.5, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{c.nombre}</div>
                {c.institucion&&<div style={{ fontSize:7, color:'rgba(255,255,255,0.55)' }}>{c.institucion}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Contenido derecha */}
      <div style={{ flex:1, padding:'22px 18px' }}>
        {d.perfil && <div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
        {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
          <div style={{ marginBottom:14 }}>
            <STitle color={color}>Experiencia Laboral</STitle>
            {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                <div style={{ fontSize:9, color:color, fontWeight:600 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                <div style={{ fontSize:8, color:'#999', marginBottom:4 }}>{per(e)}</div>
                {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                  <div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:5, marginBottom:2 }}>
                    <span style={{ color, fontWeight:700 }}>›</span>{f.replace(/^[-•]\s*/,'')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
          <div>
            <STitle color={color}>Formación Académica</STitle>
            {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
              <div key={i} style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                <div style={{ fontSize:9, color:'#666' }}>{e.institucion} <span style={{ color:'#bbb' }}>{per(e)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// P4 — CORPORATIVA: encabezado con barra lateral de color, 1 columna
function P4({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Arial, sans-serif', background:'#fff', display:'flex' }}>
      {/* Barra izquierda */}
      <div style={{ width:6, background:color, flexShrink:0 }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid ${color}30` }}>
          <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
          <div style={{ fontSize:10, color:color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
          <div style={{ fontSize:8.5, color:'#888', marginTop:6, display:'flex', gap:16 }}>
            {d.email&&<span>{d.email}</span>}
            {d.telefono&&<span>{d.telefono}</span>}
            {d.ciudad&&<span>{d.ciudad}</span>}
          </div>
        </div>
        {/* Habilidades como etiquetas */}
        {habilidades.length>0 && (
          <div style={{ padding:'10px 24px', background:`${color}08`, borderBottom:`1px solid ${color}20` }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {habilidades.map((h,i)=>(
                <span key={i} style={{ padding:'3px 10px', background:color, color:'#fff', borderRadius:3, fontSize:8.5, fontWeight:600 }}>{h}</span>
              ))}
            </div>
          </div>
        )}
        {/* Contenido 1 columna */}
        <div style={{ padding:'14px 24px', flex:1 }}>
          {d.perfil && <div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
            <div style={{ marginBottom:14 }}>
              <STitle color={color}>Experiencia Laboral</STitle>
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:12, display:'flex', gap:12 }}>
                  <div style={{ width:80, flexShrink:0, fontSize:8, color:'#aaa', paddingTop:2 }}>{per(e)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                    <div style={{ fontSize:9, color:color, marginBottom:4 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                    {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                      <div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:5, marginBottom:2 }}>
                        <span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:24 }}>
            {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
              <div style={{ flex:1 }}>
                <STitle color={color}>Formación Académica</STitle>
                {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                  <div key={i} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                    <div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div>
                    <div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ flex:1 }}>
              {d.idiomas && <div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
              {cursos.length>0 && (
                <div>
                  <STitle color={color}>Cursos</STitle>
                  {cursos.map((c,i)=><div key={i} style={{ fontSize:8.5, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// P5 — MINIMALISTA: todo en negro, líneas finas, tipografía grande
function P5({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'"Times New Roman", serif', background:'#fff', padding:'28px 36px' }}>
      {/* Header minimalista */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#000', letterSpacing:'-0.03em', lineHeight:1 }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:11, color:'#555', fontStyle:'italic', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ height:1, background:'#000', margin:'10px 0' }}/>
        <div style={{ fontSize:8.5, color:'#666', display:'flex', gap:18 }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
        </div>
      </div>
      {d.perfil && <div style={{ marginBottom:14 }}><MinTitle>Perfil Ocupacional</MinTitle><p style={{ fontSize:9.5, color:'#333', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
      {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
        <div style={{ marginBottom:14 }}>
          <MinTitle>Experiencia Laboral</MinTitle>
          {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#000' }}>{e.cargo} — {e.empresa}</div>
                <div style={{ fontSize:8.5, color:'#888', flexShrink:0 }}>{per(e)}</div>
              </div>
              {e.ciudad&&<div style={{ fontSize:8.5, color:'#888', fontStyle:'italic', marginBottom:3 }}>{e.ciudad}</div>}
              {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                <div key={j} style={{ fontSize:9, color:'#444', marginBottom:2, paddingLeft:12 }}>– {f.replace(/^[-•]\s*/,'')}</div>
              ))}
            </div>
          ))}
        </div>
      )}
      {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
        <div style={{ marginBottom:14 }}>
          <MinTitle>Formación Académica</MinTitle>
          {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <div><div style={{ fontSize:10, fontWeight:700 }}>{e.titulo}</div><div style={{ fontSize:9, color:'#666' }}>{e.institucion}</div></div>
              <div style={{ fontSize:8.5, color:'#aaa' }}>{per(e)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:24 }}>
        {habilidades.length>0 && <div style={{ flex:1 }}><MinTitle>Habilidades</MinTitle><div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{habilidades.map((h,i)=><span key={i} style={{ fontSize:8.5, color:'#333', padding:'2px 8px', border:'1px solid #333', borderRadius:2 }}>{h}</span>)}</div></div>}
        <div style={{ flex:1 }}>
          {d.idiomas && <div style={{ marginBottom:8 }}><MinTitle>Idiomas</MinTitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
          {cursos.length>0 && <div><MinTitle>Cursos</MinTitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#444', marginBottom:3 }}>{c.nombre}{c.anio&&` (${c.anio})`}</div>)}</div>}
        </div>
      </div>
    </div>
  )
}

// P6 — EJECUTIVA: fondo gris claro header, 2 columnas simétricas
function P6({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Arial, sans-serif', background:'#fff' }}>
      {/* Header gris */}
      <div style={{ background:'#f5f5f5', borderBottom:`3px solid ${color}`, padding:'20px 26px' }}>
        <div style={{ fontSize:21, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, color:color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:8.5, color:'#666', marginTop:8, display:'flex', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>✉ {d.email}</span>}
          {d.telefono&&<span>☎ {d.telefono}</span>}
          {d.ciudad&&<span>⌂ {d.ciudad}</span>}
        </div>
      </div>
      {/* Contenido 2 col simétricas */}
      <div style={{ display:'flex', padding:'16px 26px', gap:24 }}>
        {/* Columna izquierda */}
        <div style={{ flex:'0 0 55%' }}>
          {d.perfil && <div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
            <div>
              <STitle color={color}>Experiencia Laboral</STitle>
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:10, paddingLeft:10, borderLeft:`2px solid ${color}` }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:9, color:color }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                  <div style={{ fontSize:8, color:'#aaa', marginBottom:3 }}>{per(e)}</div>
                  {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                    <div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:4, marginBottom:2 }}>
                      <span style={{ color, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Columna derecha */}
        <div style={{ flex:1 }}>
          {habilidades.length>0 && (
            <div style={{ marginBottom:14 }}>
              <STitle color={color}>Habilidades</STitle>
              {habilidades.map((h,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/>
                  <div style={{ fontSize:9, color:'#333' }}>{h}</div>
                </div>
              ))}
            </div>
          )}
          {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
            <div style={{ marginBottom:14 }}>
              <STitle color={color}>Formación Académica</STitle>
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                  <div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div>
                  <div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div>
                </div>
              ))}
            </div>
          )}
          {d.idiomas && <div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
          {cursos.length>0 && (
            <div>
              <STitle color={color}>Cursos</STitle>
              {cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}{c.institucion&&<div style={{ fontSize:8, color:'#999' }}>{c.institucion}</div>}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// P7 — PREMIUM: fondo suave, todo centrado, diseño limpio
function P7({ d, color }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  const bg = color + '10'
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:'Arial, sans-serif', background:bg }}>
      {/* Header con color */}
      <div style={{ background:color, padding:'20px 28px', textAlign:'center' }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:8.5, color:'rgba(255,255,255,0.65)', marginTop:8, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
        </div>
      </div>
      {/* Habilidades chips centradas */}
      {habilidades.length>0 && (
        <div style={{ background:'#fff', padding:'10px 24px', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6, borderBottom:`1px solid ${color}30` }}>
          {habilidades.map((h,i)=>(
            <span key={i} style={{ padding:'4px 12px', background:bg, border:`1px solid ${color}50`, borderRadius:20, fontSize:8.5, color:color, fontWeight:600 }}>{h}</span>
          ))}
        </div>
      )}
      {/* Contenido */}
      <div style={{ padding:'16px 28px', background:'#fff', margin:'12px', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        {d.perfil && <div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
        {(d.experiencia||[]).filter(e=>e.cargo).length>0 && (
          <div style={{ marginBottom:14 }}>
            <STitle color={color}>Experiencia Laboral</STitle>
            {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:8.5, color:'#aaa' }}>{per(e)}</div>
                </div>
                <div style={{ fontSize:9, color:color, fontWeight:600, marginBottom:4 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                  <div key={j} style={{ fontSize:9, color:'#555', display:'flex', gap:6, marginBottom:2 }}>
                    <span style={{ color, fontWeight:700, flexShrink:0 }}>▸</span>{f.replace(/^[-•]\s*/,'')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:24 }}>
          {(d.educacion||[]).filter(e=>e.titulo).length>0 && (
            <div style={{ flex:1 }}>
              <STitle color={color}>Formación Académica</STitle>
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                  <div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div>
                  <div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ flex:1 }}>
            {d.idiomas && <div style={{ marginBottom:10 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
            {cursos.length>0 && <div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────
function Section({ color, title, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:8.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', borderBottom:`1.5px solid ${color}`, paddingBottom:3, marginBottom:7 }}>{title}</div>
      {children}
    </div>
  )
}

function STitle({ color, children }) {
  return <div style={{ fontSize:8.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', borderBottom:`1.5px solid ${color}`, paddingBottom:3, marginBottom:7 }}>{children}</div>
}

function MinTitle({ children }) {
  return <div style={{ fontSize:8, fontWeight:700, color:'#000', textTransform:'uppercase', letterSpacing:'0.12em', borderBottom:'1px solid #000', paddingBottom:2, marginBottom:6, marginTop:12 }}>{children}</div>
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
const PLANTILLAS = [
  { id:'p1', nombre:'Formal',       desc:'2 col · sidebar · barras habilidades', color:'#003DA5', Comp: P1 },
  { id:'p2', nombre:'Profesional',  desc:'1 col · chips · línea borde izq',      color:'#1E5C3A', Comp: P2 },
  { id:'p3', nombre:'Creativa',     desc:'Sidebar oscuro · viñetas ›',           color:'#7B2D8B', Comp: P3 },
  { id:'p4', nombre:'Corporativa',  desc:'Barra lateral · etiquetas sólidas',    color:'#154360', Comp: P4 },
  { id:'p5', nombre:'Minimalista',  desc:'1 col · tipografía serif · limpia',    color:'#2C2C2C', Comp: P5 },
  { id:'p6', nombre:'Ejecutiva',    desc:'Header gris · 2 col simétricas',       color:'#8B1A1A', Comp: P6 },
  { id:'p7', nombre:'Premium',      desc:'Header color · fondo suave · cards',   color:'#117A65', Comp: P7 },
]

const COLORES = ['#003DA5','#1E5C3A','#7B2D8B','#154360','#2C2C2C','#8B1A1A','#117A65','#C0392B','#784212','#1A5276']

// ─── DESCARGA PDF con html2canvas ─────────────────────────────────────────────
async function descargarPDFCanvas(ref, nombre) {
  if (!ref) return
  try {
    const canvas = await html2canvas(ref, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgW = canvas.width
    const imgH = canvas.height
    const ratio = pdfW / imgW
    const scaledH = imgH * ratio
    if (scaledH <= pdfH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, scaledH)
    } else {
      // Múltiples páginas
      let y = 0
      while (y < imgH) {
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgW
        pageCanvas.height = Math.min(pdfH / ratio, imgH - y)
        const ctx = pageCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, y, imgW, pageCanvas.height, 0, 0, imgW, pageCanvas.height)
        const pageImg = pageCanvas.toDataURL('image/png')
        if (y > 0) pdf.addPage()
        pdf.addImage(pageImg, 'PNG', 0, 0, pdfW, pageCanvas.height * ratio)
        y += pageCanvas.height
      }
    }
    pdf.save(`CV_ATS_${(nombre||'CV').replace(/\s+/g,'_')}.pdf`)
  } catch(err) {
    console.error('Error generando PDF:', err)
    alert('Error al generar el PDF. Intenta de nuevo.')
  }
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
  const [config, setConfig] = useState({ plantillaId:'p1', color:'#003DA5' })
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const fileRef = useRef()
  const previewRef = useRef()

  const actCfg = (k,v) => setConfig(c=>({...c,[k]:v}))

  const procesarArchivo = async (file) => {
    if (!file || file.type !== 'application/pdf') { setError('Por favor sube un archivo PDF válido'); return }
    setError(''); setArchivo(file.name); setCargando(true); setPaso('analizando')
    const msgs = ['Leyendo tu hoja de vida...','Extrayendo información...','Optimizando para ATS...','Mejorando el perfil con IA...','Casi listo...']
    let mi = 0; setProgresoMsg(msgs[0])
    const iv = setInterval(()=>{ mi=(mi+1)%msgs.length; setProgresoMsg(msgs[mi]) }, 2500)
    try {
      const res = await extraerDatosAPE(file)
      clearInterval(iv)
      setDatos(res)
      setPaso('plantilla')
    } catch(err) {
      clearInterval(iv)
      setError(`Error al analizar: ${err.message}`)
      setPaso('subir')
    } finally { setCargando(false) }
  }

  const handleDescargar = async () => {
    setGenerandoPDF(true)
    await descargarPDFCanvas(previewRef.current, datos?.nombre)
    setGenerandoPDF(false)
  }

  // ── Analizando ────────────────────────────────────────────────────────────
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

  // ── Plantilla + Preview ───────────────────────────────────────────────────
  if (paso === 'plantilla' && datos) {
    const plt = PLANTILLAS.find(p=>p.id===config.plantillaId) || PLANTILLAS[0]
    const Comp = plt.Comp

    return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h1 style={{ fontSize:16, fontWeight:800, color:'var(--azul)' }}>CV extraído · Escoge plantilla</h1>
            <p style={{ fontSize:11, color:'var(--texto2)', marginTop:1 }}>✅ {datos.nombre} · {(datos.experiencia||[]).length} exp · {(datos.educacion||[]).length} edu</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>{setPaso('subir');setDatos(null);setArchivo(null)}}
              style={{ padding:'7px 14px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:8, color:'var(--texto2)', fontSize:12, cursor:'pointer' }}>
              ← Subir otro
            </button>
            <button onClick={handleDescargar} disabled={generandoPDF}
              style={{ padding:'7px 18px', background: generandoPDF?'var(--gris2)':'var(--verde)', border:'none', borderRadius:8, color:'white', fontSize:13, fontWeight:700, cursor:generandoPDF?'not-allowed':'pointer' }}>
              {generandoPDF ? '⏳ Generando...' : '⬇ Descargar PDF'}
            </button>
          </div>
        </div>

        <div style={{ flex:1, display:'grid', gridTemplateColumns:'280px 1fr', overflow:'hidden' }}>
          {/* Panel control */}
          <div style={{ overflowY:'auto', borderRight:'1px solid var(--gris2)', padding:'14px', background:'var(--gris)' }}>

            {/* Plantillas */}
            <div style={{ fontSize:10, fontWeight:700, color:'var(--texto)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Plantilla</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {PLANTILLAS.map(p=>(
                <div key={p.id} onClick={()=>{ actCfg('plantillaId',p.id); actCfg('color',p.color) }}
                  style={{ padding:'8px 10px', borderRadius:8, border:`2px solid ${config.plantillaId===p.id?'var(--azul)':'var(--gris2)'}`, background:config.plantillaId===p.id?'rgba(0,61,165,0.05)':'var(--blanco)', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:config.plantillaId===p.id?'var(--azul)':'var(--texto)' }}>{p.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--texto2)' }}>{p.desc}</div>
                </div>
              ))}
            </div>

            {/* Color */}
            <div style={{ fontSize:10, fontWeight:700, color:'var(--texto)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Color</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {COLORES.map(c=>(
                <div key={c} onClick={()=>actCfg('color',c)}
                  style={{ width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s' }}/>
              ))}
              <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)}
                style={{ width:24, height:24, border:'1px solid var(--gris2)', borderRadius:6, cursor:'pointer', padding:1 }}/>
            </div>

            {/* Score */}
            {datos.score_ats && (
              <div style={{ background:'var(--blanco)', border:'1px solid var(--gris2)', borderRadius:10, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--texto)', marginBottom:6 }}>Score ATS</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:28, fontWeight:900, color:datos.score_ats>=80?'var(--verde)':datos.score_ats>=60?'#f59e0b':'#ef4444' }}>{datos.score_ats}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ height:5, background:'var(--gris2)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${datos.score_ats}%`, background:datos.score_ats>=80?'var(--verde)':datos.score_ats>=60?'#f59e0b':'#ef4444', borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:10, color:'var(--texto2)', marginTop:2 }}>/100</div>
                  </div>
                </div>
                {datos.mejoras?.length>0 && <div style={{ marginTop:8 }}>
                  {datos.mejoras.map((m,i)=><div key={i} style={{ fontSize:10, color:'var(--texto2)', marginBottom:2 }}>✅ {m}</div>)}
                </div>}
              </div>
            )}
          </div>

          {/* Preview WYSIWYG */}
          <div style={{ background:'#d0d0d0', overflow:'auto', padding:'20px', display:'flex', justifyContent:'center', alignItems:'flex-start' }}>
            <div style={{ width:794, background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
              <div ref={previewRef} style={{ width:794, minHeight:1123, background:'#fff' }}>
                <Comp d={datos} color={config.color} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Subir ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--azul)' }}>Subir CV y generar ATS profesional</h1>
        <p style={{ fontSize:13, color:'var(--texto2)', marginTop:3 }}>Sube el PDF de la APE y la IA genera una hoja de vida bonita lista para enviar</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'32px 40px' }}>
        <div style={{ maxWidth:580 }}>
          <div
            onDragOver={e=>{e.preventDefault();setArrastrando(true)}}
            onDragLeave={()=>setArrastrando(false)}
            onDrop={e=>{e.preventDefault();setArrastrando(false);procesarArchivo(e.dataTransfer.files[0])}}
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${arrastrando?'var(--verde)':error?'#ef4444':'var(--gris2)'}`, borderRadius:16, padding:'52px 32px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:arrastrando?'rgba(57,169,0,0.04)':'var(--blanco)', marginBottom:16 }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📄</div>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--texto)', marginBottom:6 }}>{archivo||'Arrastra el PDF de la APE aquí o haz clic'}</div>
            <div style={{ fontSize:13, color:'var(--texto2)', marginBottom:20 }}>Solo archivos PDF — Hoja de vida de la Agencia Pública de Empleo</div>
            <div style={{ display:'inline-block', padding:'10px 28px', background:'var(--azul)', borderRadius:9, color:'white', fontSize:13, fontWeight:700 }}>Seleccionar PDF</div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>procesarArchivo(e.target.files[0])}/>
          </div>
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:16 }}>❌ {error}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['📖','Lee el PDF de la APE','Extrae toda la información automáticamente'],['🎯','Optimiza para ATS','Mejora palabras clave y perfil profesional'],['🎨','7 plantillas únicas','Cada una con su diseño diferente'],['⬇️','WYSIWYG','Lo que ves es exactamente lo que se descarga']].map(([ic,t,desc])=>(
              <div key={t} style={{ background:'var(--gris)', borderRadius:10, padding:'12px 14px', display:'flex', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{ic}</span>
                <div><div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:2 }}>{t}</div><div style={{ fontSize:11, color:'var(--texto2)', lineHeight:1.5 }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}