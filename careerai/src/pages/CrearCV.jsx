import { useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { mejorarTexto } from '../lib/gemini.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const MESES_NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES = ['01','02','03','04','05','06','07','08','09','10','11','12']
const ANIOS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i))

const per = e => {
  const ini = e.mesInicio && e.anioInicio ? `${e.mesInicio}/${e.anioInicio}` : e.anioInicio || ''
  const fin = e.actual ? 'Actualidad' : (e.mesFin && e.anioFin ? `${e.mesFin}/${e.anioFin}` : e.anioFin || '')
  return ini && fin ? `${ini} – ${fin}` : ini || fin || ''
}

const habs6 = h => {
  if (!h) return []
  if (Array.isArray(h)) return h.slice(0, 8)
  return h.split(',').map(x => x.trim()).filter(Boolean).slice(0, 8)
}

const FUENTES = [
  { id: 'helvetica', nombre: 'Moderna',  css: 'Arial, sans-serif' },
  { id: 'times',     nombre: 'Elegante', css: 'Georgia, serif' },
  { id: 'courier',   nombre: 'Técnica',  css: '"Courier New", monospace' },
]

const COLORES = [
  '#003DA5','#1E5C3A','#7B2D8B','#154360','#2C2C2C',
  '#8B1A1A','#117A65','#C0392B','#784212','#1A5276','#555555','#B7950B',
]

const INICIAL = {
  nombre: '', cargo: '', email: '', telefono: '', ciudad: '', direccion: '', linkedin: '',
  perfil: '',
  experiencia: [{ cargo:'', empresa:'', ciudad:'', mesInicio:'', anioInicio:'', mesFin:'', anioFin:'', actual:false, funciones:'', logros:'' }],
  educacion: [{ titulo:'', institucion:'', ciudad:'', mesInicio:'', anioInicio:'', mesFin:'', anioFin:'', actual:false }],
  cursos: [{ nombre:'', institucion:'', anio:'' }],
  habilidades: '', idiomas: '',
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

// ─── 7 PLANTILLAS ─────────────────────────────────────────────────────────────

// P1 — FORMAL: 2 columnas, encabezado color, sidebar con barras
function P1({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:color, padding:'18px 22px', color:'#fff' }}>
        <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3, opacity:0.85 }}>{d.cargo||'Cargo Profesional'}</div>
        <div style={{ fontSize:8.5, marginTop:6, opacity:0.75, display:'flex', gap:14, flexWrap:'wrap' }}>
          {d.email&&<span>✉ {d.email}</span>}
          {d.telefono&&<span>📞 {d.telefono}</span>}
          {d.ciudad&&<span>📍 {d.ciudad}</span>}
          {d.linkedin&&<span>🔗 {d.linkedin}</span>}
        </div>
      </div>
      <div style={{ height:3, background:color, opacity:0.2 }}/>
      <div style={{ flex:1, display:'flex' }}>
        <div style={{ flex:'0 0 62%', padding:'14px 16px 14px 22px', borderRight:`1px solid ${color}22` }}>
          {d.perfil&&<Section color={color} title="Perfil Ocupacional"><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></Section>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
            <Section color={color} title="Experiencia Laboral">
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:9, color, fontWeight:600 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                  <div style={{ fontSize:8, color:'#888', marginBottom:4 }}>{per(e)}</div>
                  {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                    <div key={j} style={{ fontSize:8.5, color:'#444', display:'flex', gap:5, marginBottom:2 }}>
                      <span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}
                    </div>
                  ))}
                  {e.logros&&<div style={{ fontSize:8.5, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
                </div>
              ))}
            </Section>
          )}
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
            <Section color={color} title="Formación Académica">
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div>
                  <div style={{ fontSize:9, color:'#666' }}>{e.institucion}{e.ciudad&&` · ${e.ciudad}`}</div>
                  <div style={{ fontSize:8, color:'#aaa' }}>{per(e)}</div>
                </div>
              ))}
            </Section>
          )}
        </div>
        <div style={{ flex:'0 0 38%', padding:'14px 16px', background:`${color}08` }}>
          {habilidades.length>0&&(
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
          {d.idiomas&&<Section color={color} title="Idiomas"><div style={{ fontSize:8.5, color:'#333' }}>{d.idiomas}</div></Section>}
          {cursos.length>0&&(
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

// P2 — PROFESIONAL: 1 columna, chips habilidades, borde izquierdo experiencia
function P2({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', padding:'24px 32px' }}>
      <div style={{ textAlign:'center', marginBottom:16, borderBottom:`2px solid ${color}`, paddingBottom:12 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#111', letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:11, color, fontWeight:600, marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase' }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:9, color:'#777', marginTop:6, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
          {d.linkedin&&<span>{d.linkedin}</span>}
        </div>
      </div>
      {habilidades.length>0&&(
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Habilidades</STitle>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {habilidades.map((h,i)=><span key={i} style={{ padding:'4px 12px', background:`${color}15`, border:`1px solid ${color}40`, borderRadius:20, fontSize:9, color, fontWeight:600 }}>{h}</span>)}
          </div>
        </div>
      )}
      {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
      {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Experiencia Laboral</STitle>
          {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
            <div key={i} style={{ marginBottom:12, paddingLeft:12, borderLeft:`2px solid ${color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{e.cargo}</div>
              <div style={{ fontSize:9.5, color }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`} <span style={{ color:'#aaa', fontStyle:'italic' }}>{per(e)}</span></div>
              {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:9, color:'#555', marginTop:3, paddingLeft:8 }}>– {f.replace(/^[-•]\s*/,'')}</div>)}
              {e.logros&&<div style={{ fontSize:9, color:'#666', fontStyle:'italic', marginTop:3, paddingLeft:8 }}>{e.logros}</div>}
            </div>
          ))}
        </div>
      )}
      {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Formación Académica</STitle>
          {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:9, color:'#666' }}>{e.institucion}</div></div>
              <div style={{ fontSize:8.5, color:'#aaa' }}>{per(e)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:24 }}>
        {d.idiomas&&<div style={{ flex:1 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
        {cursos.length>0&&<div style={{ flex:2 }}><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.institucion&&` — ${c.institucion}`}{c.anio&&` (${c.anio})`}</div>)}</div>}
      </div>
    </div>
  )
}

// P3 — CREATIVA: sidebar oscuro izquierda
function P3({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex' }}>
      <div style={{ width:'34%', background:'#1e1e2e', padding:'22px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:900, color:'#fff', lineHeight:1.2 }}>{d.nombre||'NOMBRE'}</div>
          <div style={{ fontSize:8.5, color, fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{d.cargo||''}</div>
        </div>
        <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
          <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Contacto</div>
          {d.email&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.email}</div>}
          {d.telefono&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.telefono}</div>}
          {d.ciudad&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.ciudad}</div>}
          {d.linkedin&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.linkedin}</div>}
        </div>
        {habilidades.length>0&&(
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Habilidades</div>
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
        {d.idiomas&&<div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}><div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Idiomas</div><div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)' }}>{d.idiomas}</div></div>}
        {cursos.length>0&&(
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Cursos</div>
            {cursos.map((c,i)=><div key={i} style={{ marginBottom:5 }}><div style={{ fontSize:7.5, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{c.nombre}</div>{c.institucion&&<div style={{ fontSize:7, color:'rgba(255,255,255,0.55)' }}>{c.institucion}</div>}</div>)}
          </div>
        )}
      </div>
      <div style={{ flex:1, padding:'22px 18px' }}>
        {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
        {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
          <div style={{ marginBottom:14 }}>
            <STitle color={color}>Experiencia Laboral</STitle>
            {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                <div style={{ fontSize:9, color, fontWeight:600 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                <div style={{ fontSize:8, color:'#999', marginBottom:4 }}>{per(e)}</div>
                {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:5, marginBottom:2 }}><span style={{ color, fontWeight:700 }}>›</span>{f.replace(/^[-•]\s*/,'')}</div>)}
                {e.logros&&<div style={{ fontSize:8.5, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
              </div>
            ))}
          </div>
        )}
        {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
          <div>
            <STitle color={color}>Formación Académica</STitle>
            {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:9, color:'#666' }}>{e.institucion}{e.ciudad&&` · ${e.ciudad}`} <span style={{ color:'#bbb' }}>{per(e)}</span></div></div>)}
          </div>
        )}
      </div>
    </div>
  )
}

// P4 — CORPORATIVA: barra lateral color, etiquetas sólidas
function P4({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex' }}>
      <div style={{ width:6, background:color, flexShrink:0 }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid ${color}30` }}>
          <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
          <div style={{ fontSize:10, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
          <div style={{ fontSize:8.5, color:'#888', marginTop:6, display:'flex', gap:16, flexWrap:'wrap' }}>
            {d.email&&<span>{d.email}</span>}
            {d.telefono&&<span>{d.telefono}</span>}
            {d.ciudad&&<span>{d.ciudad}</span>}
            {d.linkedin&&<span>{d.linkedin}</span>}
          </div>
        </div>
        {habilidades.length>0&&(
          <div style={{ padding:'10px 24px', background:`${color}08`, borderBottom:`1px solid ${color}20` }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {habilidades.map((h,i)=><span key={i} style={{ padding:'3px 10px', background:color, color:'#fff', borderRadius:3, fontSize:8.5, fontWeight:600 }}>{h}</span>)}
            </div>
          </div>
        )}
        <div style={{ padding:'14px 24px', flex:1 }}>
          {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
            <div style={{ marginBottom:14 }}>
              <STitle color={color}>Experiencia Laboral</STitle>
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:12, display:'flex', gap:12 }}>
                  <div style={{ width:80, flexShrink:0, fontSize:8, color:'#aaa', paddingTop:2 }}>{per(e)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                    <div style={{ fontSize:9, color, marginBottom:4 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                    {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:5, marginBottom:2 }}><span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}</div>)}
                    {e.logros&&<div style={{ fontSize:8.5, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:24 }}>
            {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
              <div style={{ flex:1 }}>
                <STitle color={color}>Formación Académica</STitle>
                {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div><div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div></div>)}
              </div>
            )}
            <div style={{ flex:1 }}>
              {d.idiomas&&<div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
              {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:8.5, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// P5 — MINIMALISTA: serif, negro, líneas finas
function P5({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff||'"Times New Roman", serif', background:'#fff', padding:'28px 36px' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#000', letterSpacing:'-0.03em', lineHeight:1 }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:11, color:'#555', fontStyle:'italic', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ height:1, background:'#000', margin:'10px 0' }}/>
        <div style={{ fontSize:8.5, color:'#666', display:'flex', gap:18, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
          {d.linkedin&&<span>{d.linkedin}</span>}
        </div>
      </div>
      {d.perfil&&<div style={{ marginBottom:14 }}><MinTitle>Perfil Ocupacional</MinTitle><p style={{ fontSize:9.5, color:'#333', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
      {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
        <div style={{ marginBottom:14 }}>
          <MinTitle>Experiencia Laboral</MinTitle>
          {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#000' }}>{e.cargo} — {e.empresa}</div>
                <div style={{ fontSize:8.5, color:'#888', flexShrink:0 }}>{per(e)}</div>
              </div>
              {e.ciudad&&<div style={{ fontSize:8.5, color:'#888', fontStyle:'italic', marginBottom:3 }}>{e.ciudad}</div>}
              {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:9, color:'#444', marginBottom:2, paddingLeft:12 }}>– {f.replace(/^[-•]\s*/,'')}</div>)}
              {e.logros&&<div style={{ fontSize:9, color:'#555', fontStyle:'italic', paddingLeft:12, marginTop:2 }}>{e.logros}</div>}
            </div>
          ))}
        </div>
      )}
      {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
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
        {habilidades.length>0&&<div style={{ flex:1 }}><MinTitle>Habilidades</MinTitle><div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{habilidades.map((h,i)=><span key={i} style={{ fontSize:8.5, color:'#333', padding:'2px 8px', border:'1px solid #333', borderRadius:2 }}>{h}</span>)}</div></div>}
        <div style={{ flex:1 }}>
          {d.idiomas&&<div style={{ marginBottom:8 }}><MinTitle>Idiomas</MinTitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
          {cursos.length>0&&<div><MinTitle>Cursos</MinTitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#444', marginBottom:3 }}>{c.nombre}{c.anio&&` (${c.anio})`}</div>)}</div>}
        </div>
      </div>
    </div>
  )
}

// P6 — EJECUTIVA: header gris, 2 columnas simétricas
function P6({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff' }}>
      <div style={{ background:'#f5f5f5', borderBottom:`3px solid ${color}`, padding:'20px 26px' }}>
        <div style={{ fontSize:21, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:8.5, color:'#666', marginTop:8, display:'flex', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>✉ {d.email}</span>}
          {d.telefono&&<span>☎ {d.telefono}</span>}
          {d.ciudad&&<span>⌂ {d.ciudad}</span>}
          {d.linkedin&&<span>🔗 {d.linkedin}</span>}
        </div>
      </div>
      <div style={{ display:'flex', padding:'16px 26px', gap:24 }}>
        <div style={{ flex:'0 0 55%' }}>
          {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
            <div>
              <STitle color={color}>Experiencia Laboral</STitle>
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:10, paddingLeft:10, borderLeft:`2px solid ${color}` }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:9, color }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                  <div style={{ fontSize:8, color:'#aaa', marginBottom:3 }}>{per(e)}</div>
                  {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:8.5, color:'#555', display:'flex', gap:4, marginBottom:2 }}><span style={{ color, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}</div>)}
                  {e.logros&&<div style={{ fontSize:8.5, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex:1 }}>
          {habilidades.length>0&&(
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
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
            <div style={{ marginBottom:14 }}>
              <STitle color={color}>Formación Académica</STitle>
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div><div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div></div>)}
            </div>
          )}
          {d.idiomas&&<div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
          {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}{c.institucion&&<div style={{ fontSize:8, color:'#999' }}>{c.institucion}</div>}</div>)}</div>}
        </div>
      </div>
    </div>
  )
}

// P7 — PREMIUM: header color, fondo suave, cards
function P7({ d, color, ff }) {
  const habilidades = habs6(d.habilidades)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  const bg = color + '10'
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:bg }}>
      <div style={{ background:color, padding:'20px 28px', textAlign:'center' }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:8.5, color:'rgba(255,255,255,0.65)', marginTop:8, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}
          {d.telefono&&<span>{d.telefono}</span>}
          {d.ciudad&&<span>{d.ciudad}</span>}
          {d.linkedin&&<span>{d.linkedin}</span>}
        </div>
      </div>
      {habilidades.length>0&&(
        <div style={{ background:'#fff', padding:'10px 24px', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6, borderBottom:`1px solid ${color}30` }}>
          {habilidades.map((h,i)=><span key={i} style={{ padding:'4px 12px', background:bg, border:`1px solid ${color}50`, borderRadius:20, fontSize:8.5, color, fontWeight:600 }}>{h}</span>)}
        </div>
      )}
      <div style={{ padding:'16px 28px', background:'#fff', margin:'12px', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
        {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
          <div style={{ marginBottom:14 }}>
            <STitle color={color}>Experiencia Laboral</STitle>
            {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{e.cargo}</div>
                  <div style={{ fontSize:8.5, color:'#aaa' }}>{per(e)}</div>
                </div>
                <div style={{ fontSize:9, color, fontWeight:600, marginBottom:4 }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>
                {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:9, color:'#555', display:'flex', gap:6, marginBottom:2 }}><span style={{ color, fontWeight:700, flexShrink:0 }}>▸</span>{f.replace(/^[-•]\s*/,'')}</div>)}
                {e.logros&&<div style={{ fontSize:9, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:24 }}>
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
            <div style={{ flex:1 }}>
              <STitle color={color}>Formación Académica</STitle>
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div><div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div></div>)}
            </div>
          )}
          <div style={{ flex:1 }}>
            {d.idiomas&&<div style={{ marginBottom:10 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{d.idiomas}</div></div>}
            {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
const PLANTILLAS = [
  { id:'p1', nombre:'Formal',      desc:'2 col · sidebar · barras · sin foto', color:'#003DA5', Comp:P1 },
  { id:'p2', nombre:'Profesional', desc:'1 col · chips · borde izq · sin foto', color:'#1E5C3A', Comp:P2 },
  { id:'p3', nombre:'Creativa',    desc:'Sidebar oscuro · viñetas · sin foto',  color:'#7B2D8B', Comp:P3 },
  { id:'p4', nombre:'Corporativa', desc:'Barra lateral · etiquetas · sin foto', color:'#154360', Comp:P4 },
  { id:'p5', nombre:'Minimalista', desc:'1 col · serif · líneas finas',         color:'#2C2C2C', Comp:P5 },
  { id:'p6', nombre:'Ejecutiva',   desc:'Header gris · 2 col simétricas',       color:'#8B1A1A', Comp:P6 },
  { id:'p7', nombre:'Premium',     desc:'Header color · fondo suave · cards',   color:'#117A65', Comp:P7 },
]

// ─── DESCARGA PDF con html2canvas ─────────────────────────────────────────────
async function descargarPDFCanvas(ref, nombre) {
  if (!ref) return
  try {
    const canvas = await html2canvas(ref, { scale:2, useCORS:true, backgroundColor:'#ffffff', logging:false })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const ratio = pdfW / canvas.width
    const scaledH = canvas.height * ratio
    if (scaledH <= pdfH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, scaledH)
    } else {
      let y = 0
      while (y < canvas.height) {
        const pageH = Math.min(pdfH / ratio, canvas.height - y)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = pageH
        pageCanvas.getContext('2d').drawImage(canvas, 0, y, canvas.width, pageH, 0, 0, canvas.width, pageH)
        if (y > 0) pdf.addPage()
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pageH * ratio)
        y += pageH
      }
    }
    pdf.save(`CV_${(nombre||'MiCV').replace(/\s+/g,'_')}.pdf`)
  } catch(err) {
    console.error('Error PDF:', err)
    alert('Error al generar el PDF. Intenta de nuevo.')
  }
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CrearCV() {
  const location = useLocation()
  const plantillaInicial = location.state?.plantilla

  const [paso, setPaso] = useState('selector')
  const [datos, setDatos] = useState(INICIAL)
  const [mejorando, setMejorando] = useState({})
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [config, setConfig] = useState({
    plantillaId: 'p1',
    color: '#003DA5',
    fuente: 'helvetica',
  })
  const previewRef = useRef()

  const act = (k,v) => setDatos(d=>({...d,[k]:v}))
  const actCfg = (k,v) => setConfig(c=>({...c,[k]:v}))
  const actExp = (i,k,v) => { const e=[...datos.experiencia]; e[i][k]=v; setDatos(d=>({...d,experiencia:e})) }
  const actEdu = (i,k,v) => { const e=[...datos.educacion]; e[i][k]=v; setDatos(d=>({...d,educacion:e})) }
  const actCur = (i,k,v) => { const c=[...datos.cursos]; c[i][k]=v; setDatos(d=>({...d,cursos:c})) }

  const mejorar = async (campo, texto, tipo) => {
    if (!texto.trim()) return
    setMejorando(m=>({...m,[campo]:true}))
    const m = await mejorarTexto(texto, tipo)
    act(campo, m)
    setMejorando(m=>({...m,[campo]:false}))
  }

  const cargarFoto = (e) => {
    const f = e.target.files[0]; if(!f) return
    const r = new FileReader()
    r.onload = ev => act('fotoBase64', ev.target.result)
    r.readAsDataURL(f)
  }

  const handleDescargar = async () => {
    setGenerandoPDF(true)
    await descargarPDFCanvas(previewRef.current, datos.nombre)
    setGenerandoPDF(false)
  }

  const inp = { width:'100%', padding:'7px 9px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12.5, color:'var(--texto)', fontFamily:'inherit' }
  const sel = { padding:'7px 9px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12.5, color:'var(--texto)', fontFamily:'inherit', cursor:'pointer' }
  const lbl = { fontSize:10, fontWeight:700, color:'var(--texto2)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }
  const card = { background:'var(--blanco)', border:'1px solid var(--gris2)', borderRadius:12, padding:16, marginBottom:12 }

  const FechaCampo = ({ label, mK, aK, actK, item, onUp, conActual=true }) => (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
        <select value={item[mK]} onChange={e=>onUp(mK,e.target.value)} style={{...sel,width:70}} disabled={actK&&item[actK]}>
          <option value="">Mes</option>
          {MESES.map((m,i)=><option key={m} value={m}>{MESES_NOMBRES[i]}</option>)}
        </select>
        <select value={item[aK]} onChange={e=>onUp(aK,e.target.value)} style={{...sel,width:85}} disabled={actK&&item[actK]}>
          <option value="">Año</option>
          {ANIOS.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        {conActual&&actK&&<label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--texto2)', cursor:'pointer' }}><input type="checkbox" checked={item[actK]} onChange={e=>onUp(actK,e.target.checked)}/>Actualidad</label>}
      </div>
    </div>
  )

  const plt = PLANTILLAS.find(p=>p.id===config.plantillaId) || PLANTILLAS[0]
  const Comp = plt.Comp
  const ff = FUENTES.find(f=>f.id===config.fuente)?.css || 'Arial, sans-serif'

  // ── SELECTOR ──────────────────────────────────────────────────────────────
  if (paso === 'selector') return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--azul)' }}>Crear mi Hoja de Vida</h1>
        <p style={{ fontSize:13, color:'var(--texto2)', marginTop:2 }}>Elige una plantilla y personaliza el estilo</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--texto)', marginBottom:14 }}>1. Elige tu plantilla</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          {PLANTILLAS.map(p=>{
            const PComp = p.Comp
            return (
              <div key={p.id} onClick={()=>{ actCfg('plantillaId',p.id); actCfg('color',p.color) }}
                style={{ border:`2px solid ${config.plantillaId===p.id?'var(--azul)':'var(--gris2)'}`, borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', transform:config.plantillaId===p.id?'translateY(-2px)':'none', boxShadow:config.plantillaId===p.id?'0 6px 20px rgba(0,61,165,0.15)':'none' }}>
                <div style={{ height:110, overflow:'hidden', position:'relative', background:'#f5f5f5' }}>
                  <div style={{ transform:'scale(0.26)', transformOrigin:'top left', width:'385%', height:'385%', pointerEvents:'none' }}>
                    <PComp d={{ nombre:'Laura García', cargo:'Diseñadora UX', email:'laura@email.com', telefono:'300 000 0000', ciudad:'Bogotá', direccion:'Cra 7 #45', linkedin:'linkedin.com/in/laura', perfil:'Profesional con 5 años de experiencia en diseño digital y estrategia de marca.', experiencia:[{ cargo:'Diseñadora Sr', empresa:'Empresa XYZ', ciudad:'Bogotá', mesInicio:'03', anioInicio:'2021', mesFin:'', anioFin:'', actual:true, funciones:'Diseño de interfaces\nCreación de prototipos\nUser testing', logros:'Mejoré la conversión en un 30%' }], educacion:[{ titulo:'Diseño Gráfico', institucion:'Univ. Nacional', ciudad:'Bogotá', mesInicio:'01', anioInicio:'2016', mesFin:'12', anioFin:'2020', actual:false }], cursos:[{ nombre:'UX Research', institucion:'Google', anio:'2022' }], habilidades:'Figma, Photoshop, Illustrator, Liderazgo, UX', idiomas:'Español nativo, Inglés B2' }} color={p.color} ff="Arial, sans-serif"/>
                  </div>
                </div>
                <div style={{ padding:'8px 10px', background:config.plantillaId===p.id?'rgba(0,61,165,0.04)':'var(--blanco)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:config.plantillaId===p.id?'var(--azul)':'var(--texto)' }}>{p.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--texto2)' }}>{p.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:'var(--texto)', marginBottom:14 }}>2. Personaliza el estilo</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:28 }}>
          {/* Color */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Color principal</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:8 }}>
              {COLORES.map(c=><div key={c} onClick={()=>actCfg('color',c)} style={{ height:26, borderRadius:6, background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s', display:'flex', alignItems:'center', justifyContent:'center' }}>{config.color===c&&<span style={{ fontSize:11, color:'white' }}>✓</span>}</div>)}
            </div>
            <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} style={{ width:'100%', height:30, border:'none', borderRadius:6, cursor:'pointer', padding:2 }}/>
          </div>
          {/* Fuente */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Tipo de letra</div>
            {FUENTES.map(f=><div key={f.id} onClick={()=>actCfg('fuente',f.id)} style={{ padding:'7px 9px', marginBottom:6, borderRadius:8, border:`1.5px solid ${config.fuente===f.id?'var(--azul)':'var(--gris2)'}`, background:config.fuente===f.id?'rgba(0,61,165,0.05)':'var(--gris)', cursor:'pointer', transition:'all 0.15s' }}><div style={{ fontFamily:f.css, fontSize:13, fontWeight:600, color:config.fuente===f.id?'var(--azul)':'var(--texto)' }}>{f.nombre}</div><div style={{ fontFamily:f.css, fontSize:10.5, color:'var(--texto2)' }}>Aa Bb 123</div></div>)}
          </div>
          {/* Mini preview */}
          <div style={{ ...card, display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Vista previa</div>
            <div style={{ flex:1, background:'#f0f0f0', borderRadius:6, overflow:'hidden', border:'1px solid var(--gris2)', minHeight:120 }}>
              <div style={{ transform:'scale(0.3)', transformOrigin:'top left', width:'333%', height:'333%', pointerEvents:'none' }}>
                <Comp d={{ nombre:'Laura García', cargo:'Diseñadora UX', email:'laura@email.com', telefono:'300 000 0000', ciudad:'Bogotá', direccion:'', linkedin:'', perfil:'Profesional con experiencia en diseño.', experiencia:[{ cargo:'Diseñadora Sr', empresa:'Empresa XYZ', ciudad:'Bogotá', mesInicio:'03', anioInicio:'2021', mesFin:'', anioFin:'', actual:true, funciones:'Diseño de interfaces\nPrototipos', logros:'' }], educacion:[{ titulo:'Diseño Gráfico', institucion:'Univ. Nacional', ciudad:'', mesInicio:'', anioInicio:'2016', mesFin:'', anioFin:'2020', actual:false }], cursos:[{ nombre:'UX Research', institucion:'Google', anio:'2022' }], habilidades:'Figma, Photoshop, UX, Liderazgo', idiomas:'Español nativo' }} color={config.color} ff={ff}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center' }}>
          <button onClick={()=>setPaso('editor')} style={{ padding:'13px 44px', background:'var(--azul)', border:'none', borderRadius:12, color:'white', fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,61,165,0.25)' }}>
            Continuar — Llenar mi información →
          </button>
        </div>
      </div>
    </div>
  )

  // ── EDITOR ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--gris2)', background:'var(--blanco)', flexShrink:0 }}>
        <div style={{ padding:'8px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--gris2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={()=>setPaso('selector')} style={{ padding:'5px 11px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12, cursor:'pointer', color:'var(--texto2)' }}>← Plantillas</button>
            <span style={{ fontWeight:700, fontSize:13, color:'var(--azul)' }}>{plt.nombre}</span>
            <span style={{ fontSize:11, color:'var(--texto2)' }}>· El CV se actualiza en tiempo real</span>
          </div>
          <button onClick={handleDescargar} disabled={generandoPDF} style={{ padding:'8px 20px', background:generandoPDF?'var(--gris2)':'var(--verde)', border:'none', borderRadius:8, color:'white', fontWeight:700, fontSize:13, cursor:generandoPDF?'not-allowed':'pointer' }}>
            {generandoPDF?'⏳ Generando...':'⬇ Descargar PDF'}
          </button>
        </div>
        {/* Barra de estilo */}
        <div style={{ padding:'7px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Color:</span>
          {COLORES.map(c=><div key={c} onClick={()=>actCfg('color',c)} style={{ width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s', flexShrink:0 }}/>)}
          <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} style={{ width:24, height:24, border:'1px solid var(--gris2)', borderRadius:5, cursor:'pointer', padding:1 }}/>
          <div style={{ width:1, height:20, background:'var(--gris2)' }}/>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Letra:</span>
          <select value={config.fuente} onChange={e=>actCfg('fuente',e.target.value)} style={{...sel,fontSize:12,padding:'3px 7px',width:'auto'}}>
            {FUENTES.map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'400px 1fr', overflow:'hidden' }}>
        {/* FORMULARIO */}
        <div style={{ overflowY:'auto', borderRight:'1px solid var(--gris2)', padding:'14px 16px', background:'var(--gris)' }}>

          {/* Datos personales */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)', marginBottom:10 }}>Datos Personales</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
              {[['nombre','Nombre completo'],['cargo','Cargo / Título'],['email','Correo'],['telefono','Teléfono'],['ciudad','Ciudad'],['direccion','Dirección'],['linkedin','LinkedIn']].map(([k,l])=>(
                <div key={k}><label style={lbl}>{l}</label><input value={datos[k]} onChange={e=>act(k,e.target.value)} placeholder={l} style={inp}/></div>
              ))}
            </div>
          </div>

          {/* Perfil */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Perfil Ocupacional</div>
              <button onClick={()=>mejorar('perfil',datos.perfil,'perfil ocupacional')} disabled={mejorando.perfil||!datos.perfil} style={{ padding:'4px 8px', background:'rgba(57,169,0,0.1)', border:'1px solid rgba(57,169,0,0.3)', borderRadius:6, color:'var(--verde)', fontSize:11, fontWeight:700, cursor:'pointer' }}>{mejorando.perfil?'...':'✨ IA'}</button>
            </div>
            <textarea value={datos.perfil} onChange={e=>act('perfil',e.target.value)} placeholder="Describe tu perfil..." rows={3} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
          </div>

          {/* Experiencia */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Experiencia Laboral</div>
              <button onClick={()=>setDatos(d=>({...d,experiencia:[...d.experiencia,{cargo:'',empresa:'',ciudad:'',mesInicio:'',anioInicio:'',mesFin:'',anioFin:'',actual:false,funciones:'',logros:''}]}))} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {datos.experiencia.map((exp,i)=>(
              <div key={i} style={{ background:'var(--gris)', borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div><label style={lbl}>Cargo</label><input value={exp.cargo} onChange={e=>actExp(i,'cargo',e.target.value)} placeholder="Cargo" style={inp}/></div>
                  <div><label style={lbl}>Empresa</label><input value={exp.empresa} onChange={e=>actExp(i,'empresa',e.target.value)} placeholder="Empresa" style={inp}/></div>
                  <div><label style={lbl}>Ciudad</label><input value={exp.ciudad} onChange={e=>actExp(i,'ciudad',e.target.value)} placeholder="Ciudad" style={inp}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <FechaCampo label="Inicio" mK="mesInicio" aK="anioInicio" item={exp} onUp={(k,v)=>actExp(i,k,v)} conActual={false}/>
                  <FechaCampo label="Fin" mK="mesFin" aK="anioFin" actK="actual" item={exp} onUp={(k,v)=>actExp(i,k,v)}/>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <label style={lbl}>Funciones</label>
                    <button onClick={()=>{const ec=[...datos.experiencia];mejorarTexto(exp.funciones||exp.cargo,'funciones laborales').then(m=>{ec[i].funciones=m;setDatos(d=>({...d,experiencia:ec}))})}} style={{ padding:'3px 7px', background:'rgba(57,169,0,0.1)', border:'1px solid rgba(57,169,0,0.3)', borderRadius:5, color:'var(--verde)', fontSize:10, fontWeight:700, cursor:'pointer' }}>✨ IA</button>
                  </div>
                  <textarea value={exp.funciones} onChange={e=>actExp(i,'funciones',e.target.value)} placeholder="Una función por línea..." rows={3} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <label style={lbl}>Logros</label>
                    <button onClick={()=>{const ec=[...datos.experiencia];mejorarTexto(exp.logros,'logros laborales').then(m=>{ec[i].logros=m;setDatos(d=>({...d,experiencia:ec}))})}} disabled={!exp.logros} style={{ padding:'3px 7px', background:'rgba(57,169,0,0.1)', border:'1px solid rgba(57,169,0,0.3)', borderRadius:5, color:'var(--verde)', fontSize:10, fontWeight:700, cursor:'pointer' }}>✨ IA</button>
                  </div>
                  <textarea value={exp.logros} onChange={e=>actExp(i,'logros',e.target.value)} placeholder="Logros destacados..." rows={2} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Educación */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Educación</div>
              <button onClick={()=>setDatos(d=>({...d,educacion:[...d.educacion,{titulo:'',institucion:'',ciudad:'',mesInicio:'',anioInicio:'',mesFin:'',anioFin:'',actual:false}]}))} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {datos.educacion.map((edu,i)=>(
              <div key={i} style={{ background:'var(--gris)', borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div><label style={lbl}>Título</label><input value={edu.titulo} onChange={e=>actEdu(i,'titulo',e.target.value)} placeholder="Título" style={inp}/></div>
                  <div><label style={lbl}>Institución</label><input value={edu.institucion} onChange={e=>actEdu(i,'institucion',e.target.value)} placeholder="Institución" style={inp}/></div>
                  <div><label style={lbl}>Ciudad</label><input value={edu.ciudad} onChange={e=>actEdu(i,'ciudad',e.target.value)} placeholder="Ciudad" style={inp}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <FechaCampo label="Inicio" mK="mesInicio" aK="anioInicio" item={edu} onUp={(k,v)=>actEdu(i,k,v)} conActual={false}/>
                  <FechaCampo label="Fin" mK="mesFin" aK="anioFin" actK="actual" item={edu} onUp={(k,v)=>actEdu(i,k,v)}/>
                </div>
              </div>
            ))}
          </div>

          {/* Cursos */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Cursos / Formación complementaria</div>
              <button onClick={()=>setDatos(d=>({...d,cursos:[...d.cursos,{nombre:'',institucion:'',anio:''}]}))} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {datos.cursos.map((cur,i)=>(
              <div key={i} style={{ background:'var(--gris)', borderRadius:8, padding:12, marginBottom:8 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><label style={lbl}>Nombre del curso</label><input value={cur.nombre} onChange={e=>actCur(i,'nombre',e.target.value)} placeholder="Nombre" style={inp}/></div>
                  <div><label style={lbl}>Institución</label><input value={cur.institucion} onChange={e=>actCur(i,'institucion',e.target.value)} placeholder="Institución" style={inp}/></div>
                  <div><label style={lbl}>Año</label><input value={cur.anio} onChange={e=>actCur(i,'anio',e.target.value)} placeholder="2023" style={inp}/></div>
                </div>
              </div>
            ))}
          </div>

          {/* Habilidades e Idiomas */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)', marginBottom:10 }}>Habilidades e Idiomas</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div><label style={lbl}>Habilidades (separadas por comas, máx 8)</label><input value={datos.habilidades} onChange={e=>act('habilidades',e.target.value)} placeholder="Excel, Word, Liderazgo..." style={inp}/></div>
              <div><label style={lbl}>Idiomas</label><input value={datos.idiomas} onChange={e=>act('idiomas',e.target.value)} placeholder="Español nativo, Inglés B2..." style={inp}/></div>
            </div>
          </div>

          <div style={{ paddingBottom:20 }}>
            <button onClick={handleDescargar} disabled={generandoPDF} style={{ width:'100%', padding:12, background:generandoPDF?'var(--gris2)':'var(--verde)', border:'none', borderRadius:10, color:'white', fontWeight:700, fontSize:14, cursor:generandoPDF?'not-allowed':'pointer' }}>
              {generandoPDF?'⏳ Generando PDF...':'Descargar CV en PDF'}
            </button>
          </div>
        </div>

        {/* PREVIEW EN TIEMPO REAL */}
        <div style={{ background:'#d0d0d0', overflow:'auto', padding:'20px', display:'flex', justifyContent:'center', alignItems:'flex-start' }}>
          <div style={{ width:794, background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
            <div ref={previewRef} style={{ width:794, minHeight:1123, background:'#fff' }}>
              <Comp d={datos} color={config.color} ff={ff}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}