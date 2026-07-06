import { useState, useRef } from 'react'
import { mejorarTexto } from '../lib/gemini.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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
  if (Array.isArray(h)) {
    if (h.length > 0 && typeof h[0] === 'object' && h[0].nombre !== undefined) {
      return h.filter(x=>x.nombre).slice(0, 8)
    }
    return h.filter(Boolean).slice(0, 8).map(x => typeof x === 'string' ? { nombre:x, nivel:'Bueno' } : x)
  }
  return h.split(',').map(x => ({ nombre:x.trim(), nivel:'Bueno' })).filter(x=>x.nombre).slice(0, 8)
}

// Para plantillas sin nivel — solo devuelve strings
const habsStr6 = h => habs6(h).map(x => typeof x === 'object' ? x.nombre : x)

const cap = str => {
  if (!str) return ''
  return str.toLowerCase().replace(/(^\w|\s\w)/g, c => c.toUpperCase())
}

const NIVELES_HAB = ['Básico','Bueno','Muy bueno','Excelente']
const nivelW = nivel => ({ 'Básico':'25%', 'Bueno':'50%', 'Muy bueno':'75%', 'Excelente':'100%' }[nivel]||'50%')
const nivelBadgeColor = nivel => ({ 'Básico':'#94a3b8', 'Bueno':'#3b82f6', 'Muy bueno':'#8b5cf6', 'Excelente':'#10b981' }[nivel]||'#3b82f6')

const idiomasStr = ids => {
  if (!ids) return ''
  if (Array.isArray(ids)) return ids.filter(i => i.idioma).map(i => `${i.idioma}${i.nivel ? ' (' + i.nivel + ')' : ''}`).join(', ')
  return ids
}

const FUENTES = [
  { id: 'arial',   nombre: 'Moderna',  css: 'Arial, sans-serif' },
  { id: 'georgia', nombre: 'Elegante', css: 'Georgia, serif' },
  { id: 'courier', nombre: 'Técnica',  css: '"Courier New", monospace' },
]

const COLORES = [
  '#003DA5','#1E5C3A','#7B2D8B','#154360','#2C2C2C',
  '#8B1A1A','#117A65','#C0392B','#784212','#1A5276','#555555','#B7950B',
]

const INICIAL = {
  nombre:'', cargo:'', email:'', telefono:'', ciudad:'', direccion:'', linkedin:'',
  perfil:'', fotoBase64:'',
  experiencia:[{ cargo:'',empresa:'',ciudad:'',mesInicio:'',anioInicio:'',mesFin:'',anioFin:'',actual:false,funciones:'',logros:'' }],
  educacion:[{ titulo:'',institucion:'',ciudad:'',mesInicio:'',anioInicio:'',mesFin:'',anioFin:'',actual:false }],
  cursos:[{ nombre:'',institucion:'',anio:'' }],
  habilidades:[{ nombre:'', nivel:'Bueno' }],
  idiomas:[{ idioma:'', nivel:'Nativo' }],
}

function STitle({ color, children }) {
  return <div style={{ fontSize:8.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', borderBottom:`1.5px solid ${color}`, paddingBottom:3, marginBottom:7 }}>{children}</div>
}
function MinTitle({ children }) {
  return <div style={{ fontSize:8, fontWeight:700, color:'#000', textTransform:'uppercase', letterSpacing:'0.12em', borderBottom:'1px solid #000', paddingBottom:2, marginBottom:6, marginTop:10 }}>{children}</div>
}

function P1({ d, color, ff, fs=1 }) {
  const habs = habs6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:color, padding:'18px 22px', color:'#fff' }}>
        <div style={{ fontSize:20*fs, fontWeight:900 }}>{cap(d.nombre)||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10*fs, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3, opacity:0.85 }}>{cap(d.cargo)||'Cargo'}</div>
        <div style={{ fontSize:8.5*fs, marginTop:6, opacity:0.75, display:'flex', gap:14, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{cap(d.ciudad)}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
        </div>
        {d.direccion&&<div style={{ fontSize:8*fs, marginTop:3, opacity:0.65 }}>{d.direccion}</div>}
      </div>
      <div style={{ height:3, background:color, opacity:0.2 }}/>
      <div style={{ flex:1, display:'flex' }}>
        <div style={{ flex:'0 0 62%', padding:'14px 16px 14px 22px', borderRight:`1px solid ${color}22` }}>
          {d.perfil&&<div style={{ marginBottom:12 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9*fs, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
          {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
            <div style={{ marginBottom:12 }}>
              <STitle color={color}>Experiencia Laboral</STitle>
              {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10*fs, fontWeight:700, color:'#111' }}>{cap(e.cargo)}</div>
                  <div style={{ fontSize:9*fs, color, fontWeight:600 }}>{cap(e.empresa)}{e.ciudad&&` · ${cap(e.ciudad)}`}</div>
                  <div style={{ fontSize:8*fs, color:'#888', marginBottom:4 }}>{per(e)}</div>
                  {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                    <div key={j} style={{ fontSize:8.5*fs, color:'#444', display:'flex', gap:5, marginBottom:2 }}>
                      <span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f.replace(/^[-•]\s*/,'')}
                    </div>
                  ))}
                  {e.logros&&<div style={{ fontSize:8.5*fs, color:'#666', fontStyle:'italic', marginTop:2 }}>{e.logros}</div>}
                </div>
              ))}
            </div>
          )}
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&(
            <div>
              <STitle color={color}>Formación Académica</STitle>
              {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10*fs, fontWeight:700, color:'#111' }}>{cap(e.titulo)}</div>
                  <div style={{ fontSize:9*fs, color:'#666' }}>{cap(e.institucion)}{e.ciudad&&` · ${cap(e.ciudad)}`}</div>
                  <div style={{ fontSize:8*fs, color:'#aaa' }}>{per(e)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex:'0 0 38%', padding:'14px 16px', background:`${color}08` }}>
          {habs.length>0&&(
            <div style={{ marginBottom:12 }}>
              <STitle color={color}>Habilidades</STitle>
              {habs.map((h,i)=>(
                <div key={i} style={{ marginBottom:7, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                  <div style={{ fontSize:8.5*fs, color:'#333', flex:1 }}>{cap(h.nombre||h)}</div>
                  <span style={{ fontSize:7.5*fs, padding:'2px 6px', borderRadius:10, background:nivelBadgeColor(h.nivel||'Bueno'), color:'#fff', fontWeight:700, flexShrink:0 }}>{h.nivel||'Bueno'}</span>
                </div>
              ))}
            </div>
          )}
          {idStr&&<div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:8.5*fs, color:'#333' }}>{idStr}</div></div>}
          {cursos.length>0&&(
            <div>
              <STitle color={color}>Cursos</STitle>
              {cursos.map((c,i)=>(
                <div key={i} style={{ marginBottom:6 }}>
                  <div style={{ fontSize:8.5*fs, fontWeight:700, color:'#222' }}>{cap(c.nombre)}</div>
                  {c.institucion&&<div style={{ fontSize:8*fs, color:'#666' }}>{cap(c.institucion)}</div>}
                  {c.anio&&<div style={{ fontSize:7.5*fs, color:'#aaa' }}>{c.anio}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function P2({ d, color, ff, fs=1 }) {
  const habs = habsStr6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', padding:'24px 32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, borderBottom:`2px solid ${color}`, paddingBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:900, color:'#111' }}>{cap(d.nombre)||'NOMBRE COMPLETO'}</div>
          <div style={{ fontSize:11, color, fontWeight:600, marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase' }}>{cap(d.cargo)||'Cargo'}</div>
          <div style={{ fontSize:9, color:'#777', marginTop:6, display:'flex', gap:12, flexWrap:'wrap' }}>
            {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{cap(d.ciudad)}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
          </div>
          {d.direccion&&<div style={{ fontSize:8, color:'#999', marginTop:3 }}>{d.direccion}</div>}
        </div>
        <div style={{ width:70, height:80, borderRadius:4, overflow:'hidden', border:`2px solid ${color}`, flexShrink:0, marginLeft:16 }}>
          {d.fotoBase64
            ? <img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:`${color}60` }}>👤</div>
          }
        </div>
      </div>
      {habs.length>0&&<div style={{ marginBottom:14 }}><STitle color={color}>Habilidades</STitle><div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{habs.map((h,i)=><span key={i} style={{ padding:'4px 12px', background:`${color}15`, border:`1px solid ${color}40`, borderRadius:20, fontSize:9, color, fontWeight:600 }}>{cap(h)}</span>)}</div></div>}
      {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9.5, color:'#444', lineHeight:1.7, margin:0 }}>{d.perfil}</p></div>}
      {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
        <div style={{ marginBottom:14 }}>
          <STitle color={color}>Experiencia Laboral</STitle>
          {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
            <div key={i} style={{ marginBottom:12, paddingLeft:12, borderLeft:`2px solid ${color}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{e.cargo}</div>
              <div style={{ fontSize:9.5, color }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`} <span style={{ color:'#aaa', fontStyle:'italic' }}>{per(e)}</span></div>
              {e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:9, color:'#555', marginTop:3, paddingLeft:8 }}>– {f.replace(/^[-•]\s*/,'')}</div>)}
              {e.logros&&<div style={{ fontSize:9, color:'#666', fontStyle:'italic', marginTop:2, paddingLeft:8 }}>{e.logros}</div>}
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
        {idStr&&<div style={{ flex:1 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{idStr}</div></div>}
        {cursos.length>0&&<div style={{ flex:2 }}><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.institucion&&` — ${c.institucion}`}{c.anio&&` (${c.anio})`}</div>)}</div>}
      </div>
    </div>
  )
}

function P3({ d, color, ff, fs=1 }) {
  const habs = habs6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex' }}>
      <div style={{ width:'34%', background:'#1e1e2e', padding:'22px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', overflow:'hidden', margin:'0 auto 8px', border:`3px solid ${color}`, flexShrink:0 }}>
          {d.fotoBase64
            ? <img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:'rgba(255,255,255,0.3)' }}>👤</div>
          }
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, fontWeight:900, color:'#fff', lineHeight:1.2 }}>{cap(d.nombre)||'NOMBRE'}</div>
          <div style={{ fontSize:8.5, color, fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{cap(d.cargo)||''}</div>
        </div>
        <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
          <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Contacto</div>
          {d.email&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.email}</div>}
          {d.telefono&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.telefono}</div>}
          {d.ciudad&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{cap(d.ciudad)}</div>}
          {d.direccion&&<div style={{ fontSize:7, color:'rgba(255,255,255,0.6)', marginBottom:3 }}>{d.direccion}</div>}
          {d.linkedin&&<div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)', marginBottom:3 }}>{d.linkedin}</div>}
        </div>
        {habs.length>0&&(
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Habilidades</div>
            {habs.map((h,i)=>(
              <div key={i} style={{ marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                <div style={{ fontSize:7.5, color:'rgba(255,255,255,0.8)' }}>{cap(h.nombre||h)}</div>
                <span style={{ fontSize:7, padding:'1px 5px', borderRadius:8, background:nivelBadgeColor(h.nivel||'Bueno'), color:'#fff', fontWeight:700, flexShrink:0 }}>{h.nivel||'Bueno'}</span>
              </div>
            ))}
          </div>
        )}
        {idStr&&<div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}><div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Idiomas</div><div style={{ fontSize:7.5, color:'rgba(255,255,255,0.75)' }}>{idStr}</div></div>}
        {cursos.length>0&&(
          <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.15)', paddingTop:10 }}>
            <div style={{ fontSize:8, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Cursos</div>
            {cursos.map((c,i)=><div key={i} style={{ marginBottom:5 }}><div style={{ fontSize:7.5, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{cap(c.nombre)}</div>{c.institucion&&<div style={{ fontSize:7, color:'rgba(255,255,255,0.55)' }}>{cap(c.institucion)}</div>}</div>)}
          </div>
        )}
      </div>
      <div style={{ flex:1, padding:'22px 18px' }}>
        {d.perfil&&<div style={{ marginBottom:14 }}><STitle color={color}>Perfil Ocupacional</STitle><p style={{ fontSize:9*fs, color:'#444', lineHeight:1.65, margin:0 }}>{d.perfil}</p></div>}
        {(d.experiencia||[]).filter(e=>e.cargo).length>0&&(
          <div style={{ marginBottom:14 }}>
            <STitle color={color}>Experiencia Laboral</STitle>
            {(d.experiencia||[]).filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'#111' }}>{cap(e.cargo)}</div>
                <div style={{ fontSize:9, color, fontWeight:600 }}>{cap(e.empresa)}{e.ciudad&&` · ${cap(e.ciudad)}`}</div>
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
            {(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{cap(e.titulo)}</div><div style={{ fontSize:9, color:'#666' }}>{cap(e.institucion)}{e.ciudad&&` · ${cap(e.ciudad)}`} <span style={{ color:'#bbb' }}>{per(e)}</span></div></div>)}
          </div>
        )}
      </div>
    </div>
  )
}

function P4({ d, color, ff, fs=1 }) {
  const habs = habsStr6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff', display:'flex' }}>
      <div style={{ width:6, background:color, flexShrink:0 }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid ${color}30` }}>
          <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
          <div style={{ fontSize:10, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
          <div style={{ fontSize:8.5, color:'#888', marginTop:6, display:'flex', gap:16, flexWrap:'wrap' }}>
            {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{d.ciudad}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
          </div>
        </div>
        {habs.length>0&&(
          <div style={{ padding:'10px 24px', background:`${color}08`, borderBottom:`1px solid ${color}20` }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {habs.map((h,i)=><span key={i} style={{ padding:'3px 10px', background:color, color:'#fff', borderRadius:3, fontSize:8.5, fontWeight:600 }}>{h}</span>)}
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
              {idStr&&<div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{idStr}</div></div>}
              {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:8.5, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function P5({ d, color, ff, fs=1 }) {
  const habs = habsStr6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff||'"Times New Roman", serif', background:'#fff', padding:'28px 36px' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#000', letterSpacing:'-0.03em', lineHeight:1 }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:11, color:'#555', fontStyle:'italic', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ height:1, background:'#000', margin:'10px 0' }}/>
        <div style={{ fontSize:8.5, color:'#666', display:'flex', gap:18, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{d.ciudad}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
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
        {habs.length>0&&<div style={{ flex:1 }}><MinTitle>Habilidades</MinTitle><div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{habs.map((h,i)=><span key={i} style={{ fontSize:8.5, color:'#333', padding:'2px 8px', border:'1px solid #333', borderRadius:2 }}>{h}</span>)}</div></div>}
        <div style={{ flex:1 }}>
          {idStr&&<div style={{ marginBottom:8 }}><MinTitle>Idiomas</MinTitle><div style={{ fontSize:9.5, color:'#444' }}>{idStr}</div></div>}
          {cursos.length>0&&<div><MinTitle>Cursos</MinTitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#444', marginBottom:3 }}>{c.nombre}{c.anio&&` (${c.anio})`}</div>)}</div>}
        </div>
      </div>
    </div>
  )
}

function P6({ d, color, ff, fs=1 }) {
  const habs = habsStr6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:'#fff' }}>
      <div style={{ background:'#f5f5f5', borderBottom:`3px solid ${color}`, padding:'20px 26px', display:'flex', gap:16, alignItems:'center' }}>
        <div style={{ width:72, height:80, borderRadius:4, overflow:'hidden', border:`2px solid ${color}`, flexShrink:0 }}>
          {d.fotoBase64
            ? <img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:`${color}50` }}>👤</div>
          }
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:21, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
          <div style={{ fontSize:10, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{d.cargo||'Cargo'}</div>
          <div style={{ fontSize:8.5, color:'#666', marginTop:8, display:'flex', gap:16, flexWrap:'wrap' }}>
            {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{d.ciudad}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
          </div>
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
          {habs.length>0&&<div style={{ marginBottom:14 }}><STitle color={color}>Habilidades</STitle>{habs.map((h,i)=><div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}><div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/><div style={{ fontSize:9, color:'#333' }}>{h}</div></div>)}</div>}
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&<div style={{ marginBottom:14 }}><STitle color={color}>Formación Académica</STitle>{(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div><div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div></div>)}</div>}
          {idStr&&<div style={{ marginBottom:12 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{idStr}</div></div>}
          {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
        </div>
      </div>
    </div>
  )
}

function P7({ d, color, ff, fs=1 }) {
  const habs = habsStr6(d.habilidades)
  const idStr = idiomasStr(d.idiomas)
  const cursos = (d.cursos||[]).filter(c=>c.nombre).slice(0,4)
  const bg = color + '10'
  return (
    <div style={{ width:'100%', minHeight:'100%', fontFamily:ff, background:bg }}>
      <div style={{ background:color, padding:'20px 28px', textAlign:'center' }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff' }}>{d.nombre||'NOMBRE COMPLETO'}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{d.cargo||'Cargo'}</div>
        <div style={{ fontSize:8.5, color:'rgba(255,255,255,0.65)', marginTop:8, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {d.email&&<span>{d.email}</span>}{d.telefono&&<span>{d.telefono}</span>}{d.ciudad&&<span>{d.ciudad}</span>}{d.linkedin&&<span>{d.linkedin}</span>}
        </div>
      </div>
      {habs.length>0&&(
        <div style={{ background:'#fff', padding:'10px 24px', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6, borderBottom:`1px solid ${color}30` }}>
          {habs.map((h,i)=><span key={i} style={{ padding:'4px 12px', background:bg, border:`1px solid ${color}50`, borderRadius:20, fontSize:8.5, color, fontWeight:600 }}>{h}</span>)}
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
          {(d.educacion||[]).filter(e=>e.titulo).length>0&&<div style={{ flex:1 }}><STitle color={color}>Formación Académica</STitle>{(d.educacion||[]).filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:8 }}><div style={{ fontSize:10, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:8.5, color:'#666' }}>{e.institucion}</div><div style={{ fontSize:8, color:'#bbb' }}>{per(e)}</div></div>)}</div>}
          <div style={{ flex:1 }}>
            {idStr&&<div style={{ marginBottom:10 }}><STitle color={color}>Idiomas</STitle><div style={{ fontSize:9.5, color:'#444' }}>{idStr}</div></div>}
            {cursos.length>0&&<div><STitle color={color}>Cursos</STitle>{cursos.map((c,i)=><div key={i} style={{ fontSize:9, color:'#555', marginBottom:4 }}><strong>{c.nombre}</strong>{c.anio&&` (${c.anio})`}</div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const PLANTILLAS = [
  { id:'p1', nombre:'Formal',      desc:'Sin foto · 2 col · sidebar barras',    color:'#003DA5', conFoto:false, Comp:P1 },
  { id:'p2', nombre:'Profesional', desc:'Con foto · 1 col · chips habilidades', color:'#1E5C3A', conFoto:true,  Comp:P2 },
  { id:'p3', nombre:'Creativa',    desc:'Con foto · sidebar oscuro · barras',   color:'#7B2D8B', conFoto:true,  Comp:P3 },
  { id:'p4', nombre:'Corporativa', desc:'Sin foto · barra lateral · etiquetas', color:'#154360', conFoto:false, Comp:P4 },
  { id:'p5', nombre:'Minimalista', desc:'Sin foto · serif · líneas finas',      color:'#2C2C2C', conFoto:false, Comp:P5 },
  { id:'p6', nombre:'Ejecutiva',   desc:'Con foto · header gris · 2 col',       color:'#8B1A1A', conFoto:true,  Comp:P6 },
  { id:'p7', nombre:'Premium',     desc:'Sin foto · header color · cards',      color:'#117A65', conFoto:false, Comp:P7 },
]

// ─── PDF CORREGIDO ────────────────────────────────────────────────────────────
async function descargarPDF(ref, nombre) {
  if (!ref) return
  try {
    const canvas = await html2canvas(ref, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const ratio = pdfW / canvas.width
    const scaledH = canvas.height * ratio
    if (scaledH <= pdfH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, scaledH)
    } else {
      let y = 0
      while (y < canvas.height) {
        const pageH = Math.min(pdfH/ratio, canvas.height-y)
        const pc = document.createElement('canvas')
        pc.width = canvas.width; pc.height = pageH
        pc.getContext('2d').drawImage(canvas,0,y,canvas.width,pageH,0,0,canvas.width,pageH)
        if(y>0) pdf.addPage()
        pdf.addImage(pc.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pageH*ratio)
        y += pageH
      }
    }
    pdf.save(`CV_${(nombre||'MiCV').replace(/\s+/g,'_')}.pdf`)
  } catch(err) {
    console.error('Error PDF:', err)
    alert('Error al generar el PDF: ' + err.message)
  }
}

export default function CrearCV() {
  const [paso, setPaso] = useState('selector')
  const [datos, setDatos] = useState(INICIAL)
  const [mejorando, setMejorando] = useState({})
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [config, setConfig] = useState({ plantillaId:'p1', color:'#003DA5', fuente:'arial', fs:1.15 })
  const previewRef = useRef()

  const act = (k,v) => setDatos(d=>({...d,[k]:v}))
  const actCfg = (k,v) => setConfig(c=>({...c,[k]:v}))
  const actExp = (i,k,v) => { const e=[...datos.experiencia]; e[i][k]=v; setDatos(d=>({...d,experiencia:e})) }
  const actEdu = (i,k,v) => { const e=[...datos.educacion]; e[i][k]=v; setDatos(d=>({...d,educacion:e})) }
  const actCur = (i,k,v) => { const c=[...datos.cursos]; c[i][k]=v; setDatos(d=>({...d,cursos:c})) }
  const actHab = (i,k,v) => { const h=[...(datos.habilidades||[])]; h[i]={...h[i],[k]:v}; act('habilidades',h) }
  const actId  = (i,k,v) => { const ids=[...(datos.idiomas||[])]; ids[i]={...ids[i],[k]:v}; act('idiomas',ids) }

  const mejorar = async (campo, texto, tipo) => {
    if(!texto.trim()) return
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
    await descargarPDF(previewRef.current, datos.nombre)
    setGenerandoPDF(false)
  }

  const inp = { width:'100%', padding:'7px 9px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12.5, color:'var(--texto)', fontFamily:'inherit' }
  const sel = { padding:'7px 9px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12.5, color:'var(--texto)', fontFamily:'inherit', cursor:'pointer' }
  const lbl = { fontSize:10, fontWeight:700, color:'var(--texto2)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }
  const card = { background:'var(--blanco)', border:'1px solid var(--gris2)', borderRadius:12, padding:16, marginBottom:12 }

  const plt = PLANTILLAS.find(p=>p.id===config.plantillaId) || PLANTILLAS[0]
  const Comp = plt.Comp
  const ff = FUENTES.find(f=>f.id===config.fuente)?.css || 'Arial, sans-serif'

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

  const DEMO = { nombre:'Laura García', cargo:'Diseñadora UX', email:'laura@email.com', telefono:'300 000 0000', ciudad:'Bogotá', direccion:'', linkedin:'linkedin.com/in/laura', perfil:'Profesional con experiencia en diseño digital.', fotoBase64:'', experiencia:[{ cargo:'Diseñadora Sr', empresa:'Empresa XYZ', ciudad:'Bogotá', mesInicio:'03', anioInicio:'2021', mesFin:'', anioFin:'', actual:true, funciones:'Diseño de interfaces\nPrototipos', logros:'' }], educacion:[{ titulo:'Diseño Gráfico', institucion:'Univ. Nacional', ciudad:'', mesInicio:'', anioInicio:'2016', mesFin:'', anioFin:'2020', actual:false }], cursos:[{ nombre:'UX Research', institucion:'Google', anio:'2022' }], habilidades:['Figma','Photoshop','UX','Liderazgo'], idiomas:[{ idioma:'Español', nivel:'Nativo' },{ idioma:'Inglés', nivel:'B2' }] }

  if (paso === 'selector') return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)' }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:'var(--azul)' }}>Crear Hoja de Vida</h1>
        <p style={{ fontSize:12, color:'var(--texto2)', marginTop:2 }}>Elige una plantilla y personaliza el estilo</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:10 }}>Plantilla</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {PLANTILLAS.map(p=>{
            const PComp = p.Comp
            return (
              <div key={p.id} onClick={()=>{ actCfg('plantillaId',p.id); actCfg('color',p.color) }}
                style={{ border:`2px solid ${config.plantillaId===p.id?'var(--azul)':'var(--gris2)'}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', transform:config.plantillaId===p.id?'translateY(-2px)':'none', boxShadow:config.plantillaId===p.id?'0 4px 16px rgba(0,61,165,0.15)':'none' }}>
                <div style={{ aspectRatio:'794/1123', overflow:'hidden', background:'#fff', position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, width:794, height:1123, transform:'scale(0.36)', transformOrigin:'top left', pointerEvents:'none' }}>
                    <PComp d={DEMO} color={p.color} ff="Arial, sans-serif"/>
                  </div>
                </div>
                <div style={{ padding:'7px 9px', background:config.plantillaId===p.id?'rgba(0,61,165,0.04)':'var(--blanco)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:config.plantillaId===p.id?'var(--azul)':'var(--texto)' }}>{p.nombre}</div>
                  <div style={{ fontSize:9.5, color:'var(--texto2)' }}>{p.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Color principal</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, marginBottom:8 }}>
              {COLORES.map(c=><div key={c} onClick={()=>actCfg('color',c)} style={{ height:24, borderRadius:5, background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s', display:'flex', alignItems:'center', justifyContent:'center' }}>{config.color===c&&<span style={{ fontSize:10, color:'white' }}>✓</span>}</div>)}
            </div>
            <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} style={{ width:'100%', height:28, border:'none', borderRadius:6, cursor:'pointer', padding:2 }}/>
          </div>
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Tipo de letra</div>
            {FUENTES.map(f=><div key={f.id} onClick={()=>actCfg('fuente',f.id)} style={{ padding:'6px 8px', marginBottom:5, borderRadius:7, border:`1.5px solid ${config.fuente===f.id?'var(--azul)':'var(--gris2)'}`, background:config.fuente===f.id?'rgba(0,61,165,0.05)':'var(--gris)', cursor:'pointer', transition:'all 0.15s' }}><div style={{ fontFamily:f.css, fontSize:12, fontWeight:600, color:config.fuente===f.id?'var(--azul)':'var(--texto)' }}>{f.nombre}</div><div style={{ fontFamily:f.css, fontSize:10, color:'var(--texto2)' }}>Aa Bb 123</div></div>)}
          </div>
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Vista previa</div>
            <div style={{ background:'#f0f0f0', borderRadius:6, overflow:'hidden', border:'1px solid var(--gris2)', height:200, position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:794, height:1123, transform:'scale(0.185)', transformOrigin:'top left', pointerEvents:'none' }}>
                <Comp d={DEMO} color={config.color} ff={ff}/>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center' }}>
          <button onClick={()=>setPaso('editor')} style={{ padding:'12px 40px', background:'var(--azul)', border:'none', borderRadius:10, color:'white', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(0,61,165,0.25)' }}>
            Continuar — Llenar mi información →
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ borderBottom:'1px solid var(--gris2)', background:'var(--blanco)', flexShrink:0 }}>
        <div style={{ padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={()=>setPaso('selector')} style={{ padding:'5px 10px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12, cursor:'pointer', color:'var(--texto2)' }}>← Plantillas</button>
            <span style={{ fontWeight:700, fontSize:13, color:'var(--azul)' }}>{plt.nombre}</span>
            <span style={{ fontSize:11, color:'var(--texto2)' }}>{plt.conFoto?'· Con foto':'· Sin foto'}</span>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {COLORES.slice(0,6).map(c=><div key={c} onClick={()=>actCfg('color',c)} style={{ width:18, height:18, borderRadius:'50%', background:c, cursor:'pointer', border:config.color===c?'2px solid white':'1px solid transparent', boxShadow:config.color===c?`0 0 0 1.5px ${c}`:'none', flexShrink:0 }}/>)}
            <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} style={{ width:22, height:22, border:'1px solid var(--gris2)', borderRadius:4, cursor:'pointer', padding:1 }}/>
            <div style={{ width:1, height:18, background:'var(--gris2)', margin:'0 2px' }}/>
            <select value={config.fuente} onChange={e=>actCfg('fuente',e.target.value)} style={{...sel,fontSize:11,padding:'3px 6px',width:'auto'}}>
              {FUENTES.map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
            <div style={{ display:'flex', border:'1px solid var(--gris2)', borderRadius:6, overflow:'hidden' }}>
              {[['S',0.88],['M',1],['L',1.15]].map(([l,v])=>(
                <button key={l} onClick={()=>actCfg('fs',v)} style={{ padding:'4px 8px', border:'none', background:config.fs===v?'var(--azul)':'var(--blanco)', color:config.fs===v?'white':'var(--texto2)', fontSize:11, fontWeight:700, cursor:'pointer' }}>{l}</button>
              ))}
            </div>
            <button onClick={handleDescargar} disabled={generandoPDF} style={{ padding:'7px 16px', background:generandoPDF?'var(--gris2)':'var(--verde)', border:'none', borderRadius:7, color:'white', fontWeight:700, fontSize:12, cursor:generandoPDF?'not-allowed':'pointer' }}>
              {generandoPDF?'⏳...':'⬇ PDF'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'380px 1fr', overflow:'hidden' }}>
        <div style={{ overflowY:'auto', borderRight:'1px solid var(--gris2)', padding:'12px 14px', background:'var(--gris)' }}>

          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)', marginBottom:10 }}>Datos Personales</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['nombre','Nombre completo'],['cargo','Cargo / Título'],['email','Correo'],['telefono','Teléfono'],['ciudad','Ciudad'],['direccion','Dirección'],['linkedin','LinkedIn']].map(([k,l])=>(
                <div key={k}><label style={lbl}>{l}</label><input value={datos[k]} onChange={e=>act(k,e.target.value)} placeholder={l} style={inp}/></div>
              ))}
            </div>
            {plt.conFoto && (
              <div style={{ marginTop:10 }}>
                <label style={lbl}>Foto de perfil</label>
                <div onClick={()=>document.getElementById('fotoInp').click()} style={{ border:'2px dashed var(--gris2)', borderRadius:8, padding:10, cursor:'pointer', background:'#fff', display:'flex', alignItems:'center', gap:10 }}>
                  {datos.fotoBase64
                    ? <img src={datos.fotoBase64} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}/>
                    : <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--gris)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📷</div>
                  }
                  <span style={{ fontSize:12, color:'var(--texto2)' }}>{datos.fotoBase64?'Cambiar foto':'Subir foto (opcional)'}</span>
                </div>
                <input id="fotoInp" type="file" accept="image/*" style={{ display:'none' }} onChange={cargarFoto}/>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Perfil Ocupacional</div>
              <button onClick={()=>mejorar('perfil',datos.perfil,'perfil ocupacional')} disabled={mejorando.perfil||!datos.perfil} style={{ padding:'4px 8px', background:'rgba(57,169,0,0.1)', border:'1px solid rgba(57,169,0,0.3)', borderRadius:6, color:'var(--verde)', fontSize:11, fontWeight:700, cursor:'pointer' }}>{mejorando.perfil?'...':'✨ IA'}</button>
            </div>
            <textarea value={datos.perfil} onChange={e=>act('perfil',e.target.value)} placeholder="Describe tu perfil..." rows={3} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
          </div>

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
                <button onClick={()=>setDatos(d=>({...d,experiencia:d.experiencia.filter((_,j)=>j!==i)}))} style={{ fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer', marginTop:6 }}>🗑 Eliminar</button>
              </div>
            ))}
          </div>

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
                <button onClick={()=>setDatos(d=>({...d,educacion:d.educacion.filter((_,j)=>j!==i)}))} style={{ fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer', marginTop:6 }}>🗑 Eliminar</button>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Cursos</div>
              <button onClick={()=>setDatos(d=>({...d,cursos:[...d.cursos,{nombre:'',institucion:'',anio:''}]}))} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {datos.cursos.map((cur,i)=>(
              <div key={i} style={{ background:'var(--gris)', borderRadius:8, padding:12, marginBottom:8 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div><label style={lbl}>Nombre</label><input value={cur.nombre} onChange={e=>actCur(i,'nombre',e.target.value)} placeholder="Nombre del curso" style={inp}/></div>
                  <div><label style={lbl}>Institución</label><input value={cur.institucion} onChange={e=>actCur(i,'institucion',e.target.value)} placeholder="Institución" style={inp}/></div>
                  <div><label style={lbl}>Año</label><input value={cur.anio} onChange={e=>actCur(i,'anio',e.target.value)} placeholder="2023" style={inp}/></div>
                </div>
                <button onClick={()=>setDatos(d=>({...d,cursos:d.cursos.filter((_,j)=>j!==i)}))} style={{ fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer', marginTop:6 }}>🗑 Eliminar</button>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Habilidades</div>
              <button onClick={()=>act('habilidades',[...(datos.habilidades||[]),{ nombre:'', nivel:'Bueno' }])} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {(datos.habilidades||[]).map((h,i)=>(
              <div key={i} style={{ display:'flex', gap:6, marginBottom:6, alignItems:'center' }}>
                <input value={h.nombre||''} onChange={e=>actHab(i,'nombre',e.target.value)} placeholder={`Habilidad ${i+1}`} style={{...inp,marginBottom:0,flex:2}}/>
                <select value={h.nivel||'Bueno'} onChange={e=>actHab(i,'nivel',e.target.value)} style={{...sel,marginBottom:0,flex:1,padding:'7px 6px',fontSize:11}}>
                  {NIVELES_HAB.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={()=>act('habilidades',(datos.habilidades||[]).filter((_,j)=>j!==i))} style={{ padding:'6px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, color:'#ef4444', fontSize:13, cursor:'pointer', flexShrink:0 }}>×</button>
              </div>
            ))}
            {(!datos.habilidades||datos.habilidades.length===0)&&<div style={{ fontSize:11, color:'var(--texto2)', textAlign:'center', padding:'8px 0' }}>Presiona "+ Añadir" para agregar habilidades</div>}
          </div>

          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--azul)' }}>Idiomas</div>
              <button onClick={()=>act('idiomas',[...(datos.idiomas||[]),{ idioma:'', nivel:'Básico' }])} style={{ padding:'4px 8px', background:'rgba(0,61,165,0.1)', border:'1px solid rgba(0,61,165,0.3)', borderRadius:6, color:'var(--azul)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Añadir</button>
            </div>
            {(datos.idiomas||[]).map((id,i)=>(
              <div key={i} style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
                <input value={id.idioma} onChange={e=>actId(i,'idioma',e.target.value)} placeholder="Idioma" style={{...inp,marginBottom:0,flex:2}}/>
                <select value={id.nivel} onChange={e=>actId(i,'nivel',e.target.value)} style={{...sel,marginBottom:0,flex:1,padding:'7px 6px',fontSize:12}}>
                  <option value="Nativo">Nativo</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Básico">Básico</option>
                  <option value="B2">B2</option>
                  <option value="B1">B1</option>
                  <option value="A2">A2</option>
                  <option value="A1">A1</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
                <button onClick={()=>act('idiomas',(datos.idiomas||[]).filter((_,j)=>j!==i))} style={{ padding:'6px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, color:'#ef4444', fontSize:13, cursor:'pointer', flexShrink:0 }}>×</button>
              </div>
            ))}
            {(!datos.idiomas||datos.idiomas.length===0)&&<div style={{ fontSize:11, color:'var(--texto2)', textAlign:'center', padding:'8px 0' }}>Presiona "+ Añadir" para agregar idiomas</div>}
          </div>

          <div style={{ paddingBottom:20 }}>
            <button onClick={handleDescargar} disabled={generandoPDF} style={{ width:'100%', padding:12, background:generandoPDF?'var(--gris2)':'var(--verde)', border:'none', borderRadius:10, color:'white', fontWeight:700, fontSize:14, cursor:generandoPDF?'not-allowed':'pointer' }}>
              {generandoPDF?'⏳ Generando PDF...':'Descargar CV en PDF'}
            </button>
          </div>
        </div>

        <div style={{ background:'#d0d0d0', overflow:'auto', padding:'20px', display:'flex', justifyContent:'center', alignItems:'flex-start' }}>
          <div style={{ width:794, background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
            <div ref={previewRef} style={{ width:794, background:'#fff' }}>
              <Comp d={datos} color={config.color} ff={ff} fs={config.fs}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}