import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { mejorarTexto } from '../lib/gemini.js'
import { jsPDF } from 'jspdf'

// ─── UTILS ────────────────────────────────────────────────────────────────────
const hexToRgb = hex => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]

const MESES_NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES = ['01','02','03','04','05','06','07','08','09','10','11','12']
const ANIOS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i))

const periodo = (e) => {
  const ini = e.mesInicio && e.anioInicio ? `${e.mesInicio}/${e.anioInicio}` : e.anioInicio || ''
  const fin = e.actual ? 'Actual' : (e.mesFin && e.anioFin ? `${e.mesFin}/${e.anioFin}` : e.anioFin || '')
  if (ini && fin) return `${ini} - ${fin}`
  return ini || fin || ''
}

const FUENTES = [
  { id: 'helvetica', nombre: 'Moderna', css: 'Arial, sans-serif' },
  { id: 'times', nombre: 'Elegante', css: 'Georgia, serif' },
  { id: 'courier', nombre: 'Técnica', css: '"Courier New", monospace' },
]

const COLORES = ['#003DA5','#1E8449','#2C3E50','#C0392B','#6C3483','#784212','#154360','#117A65','#1A5276','#922B21','#555555','#B7950B']

const INICIAL = {
  nombre: '', cargo: '', email: '', telefono: '', ciudad: '', direccion: '', linkedin: '',
  perfil: '', fotoBase64: '',
  experiencia: [{ cargo:'', empresa:'', ciudad:'', mesInicio:'', anioInicio:'', mesFin:'', anioFin:'', actual:false, funciones:'', logros:'' }],
  educacion: [{ titulo:'', institucion:'', ciudad:'', mesInicio:'', anioInicio:'', mesFin:'', anioFin:'', actual:false }],
  cursos: [{ nombre:'', institucion:'', anio:'' }],
  habilidades: '', idiomas: '',
}

// ─── PREVIEWS ─────────────────────────────────────────────────────────────────

function P1({ d, color, ff }) {
  const cl = color+'22'
  const tS = { fontSize:7.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4, marginTop:7 }
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'12px 14px 8px', borderBottom:`2px solid ${color}` }}>
        <div style={{ fontSize:20, fontWeight:900, color:'#111', lineHeight:1.1 }}>{d.nombre||'NOMBRE APELLIDOS'}</div>
        <div style={{ fontSize:7.5, color, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{d.cargo||'PUESTO OCUPADO'}</div>
        <div style={{ fontSize:6, color:'#666', marginTop:3, display:'flex', gap:8 }}>
          {d.direccion&&<span>{d.direccion}</span>}{d.telefono&&<span>Tel: {d.telefono}</span>}{d.email&&<span>{d.email}</span>}
        </div>
      </div>
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:'0 0 60%', padding:'7px 9px', borderRight:`1px solid ${cl}` }}>
          {d.perfil && (
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`1px solid ${cl}`, paddingBottom:2, marginBottom:3 }}>Perfil Ocupacional</div>
              <p style={{ fontSize:6, color:'#444', lineHeight:1.5 }}>{d.perfil}</p>
            </div>
          )}
          {d.experiencia?.[0]?.cargo && <>
            <div style={tS}>Experiencia Profesional</div>
            {d.experiencia.filter(e=>e.cargo).map((e,i)=>(
              <div key={i} style={{ marginBottom:6, display:'flex', gap:5 }}>
                <div style={{ width:40, flexShrink:0, fontSize:5.5, color, lineHeight:1.7 }}>
                  {e.mesInicio&&<div>{e.mesInicio}/{e.anioInicio}</div>}
                  <div>{e.actual?'Actual':(e.mesFin?`${e.mesFin}/${e.anioFin}`:'')}</div>
                  {e.ciudad&&<div style={{ color:'#999', fontStyle:'italic' }}>{e.ciudad}</div>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.empresa}</div>
                  <div style={{ fontSize:6.5, fontStyle:'italic', color:'#555' }}>{e.cargo}</div>
                  {e.funciones && e.funciones.split('\n').filter(Boolean).map((f,j)=>(
                    <div key={j} style={{ fontSize:6, color:'#555', display:'flex', gap:3, marginTop:1 }}>
                      <span style={{ color, fontWeight:700, flexShrink:0 }}>•</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>}
          {d.educacion?.[0]?.titulo && <>
            <div style={tS}>Estudios</div>
            {d.educacion.filter(e=>e.titulo).map((e,i)=>(
              <div key={i} style={{ marginBottom:5, display:'flex', gap:5 }}>
                <div style={{ width:40, flexShrink:0, fontSize:5.5, color, lineHeight:1.7 }}>
                  {e.anioInicio&&<div>{e.anioInicio}</div>}
                </div>
                <div>
                  <div style={{ fontSize:7, fontWeight:700 }}>{e.titulo}</div>
                  <div style={{ fontSize:6, color:'#777', fontStyle:'italic' }}>{e.institucion}</div>
                </div>
              </div>
            ))}
          </>}
        </div>
        <div style={{ flex:'0 0 40%', background:cl, padding:'7px 7px' }}>
          {d.habilidades&&<><div style={tS}>Habilidades</div>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:6.5, color:'#333', marginBottom:1.5 }}>{h}</div>)}</>}
          {d.idiomas&&<><div style={tS}>Idiomas</div>{d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:6.5, color:'#333', marginBottom:1.5 }}>{h}</div>)}</>}
          {d.cursos?.[0]?.nombre&&<><div style={tS}>Cursos</div>{d.cursos.filter(c=>c.nombre).map((c,i)=><div key={i} style={{ fontSize:6, color:'#444', marginBottom:3 }}><div style={{ fontWeight:700 }}>{c.nombre}</div>{c.institucion&&<div style={{ color:'#888' }}>{c.institucion}</div>}</div>)}</>}
        </div>
      </div>
    </div>
  )
}

function P2({ d, color, ff }) {
  const tS = { fontSize:7.5, fontWeight:700, color:'#222', textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:'1px solid #ddd', paddingBottom:2, marginBottom:4, marginTop:7 }
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', padding:'10px 12px', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:900, color:'#111' }}>{d.nombre||'NOMBRE APELLIDO'}</div>
          <div style={{ fontSize:7, color:'#555', marginTop:2 }}>{d.cargo||'Puesto Ocupado'}</div>
          <div style={{ fontSize:6, color:'#888', marginTop:3, lineHeight:1.8 }}>
            {d.telefono&&<div>{d.telefono}</div>}{d.email&&<div>{d.email}</div>}{d.ciudad&&<div>{d.ciudad}</div>}
          </div>
        </div>
        <div style={{ width:50, height:56, borderRadius:3, overflow:'hidden', flexShrink:0, border:'1px solid #eee', marginLeft:8 }}>
          {d.fotoBase64?<img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ width:'100%', height:'100%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', fontSize:18 }}>👤</div>}
        </div>
      </div>
      {d.perfil&&<div style={{ ...tS, marginTop:0 }}>Perfil</div>}
      {d.perfil&&<p style={{ fontSize:6.5, color:'#444', lineHeight:1.5, marginBottom:5 }}>{d.perfil}</p>}
      {d.habilidades&&<><div style={tS}>Habilidades</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'2px 6px', marginBottom:5 }}>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:6.5, color:'#333' }}><span style={{ color }}>•</span> {h}</div>)}</div></>}
      {d.experiencia?.[0]?.cargo&&<><div style={tS}>Experiencia</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:5, display:'flex', gap:6 }}><div style={{ width:34, flexShrink:0, fontSize:5.5, color:'#888', lineHeight:1.7 }}><div>{e.mesInicio&&`${e.mesInicio}/${e.anioInicio}`}</div><div>{e.actual?'Actual':(e.mesFin?`${e.mesFin}/${e.anioFin}`:'')}</div></div><div style={{ flex:1 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.empresa} | {e.cargo}</div>{e.funciones&&<div style={{ fontSize:6, color:'#666', marginTop:1 }}>{e.funciones}</div>}</div></div>)}</>}
      {d.educacion?.[0]?.titulo&&<><div style={tS}>Educación</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'3px 6px' }}>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i}><div style={{ fontSize:7, fontWeight:700, color:'#222' }}>{e.titulo}</div><div style={{ fontSize:6, color:'#888' }}>{e.institucion}</div><div style={{ fontSize:6, color:'#aaa' }}>{e.anioInicio}{e.anioFin?` - ${e.anioFin}`:''}</div></div>)}</div></>}
    </div>
  )
}

function P3({ d, color, ff }) {
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', overflow:'hidden' }}>
      <div style={{ width:'32%', background:'#2b2b2b', padding:'8px 7px', display:'flex', flexDirection:'column' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', margin:'0 auto 6px', border:`2px solid ${color}`, flexShrink:0 }}>
          {d.fotoBase64?<img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ width:'100%', height:'100%', background:'#444', display:'flex', alignItems:'center', justifyContent:'center', color:'#666', fontSize:22 }}>👤</div>}
        </div>
        {d.perfil&&<><div style={{ fontSize:6, fontWeight:700, color, textTransform:'uppercase', marginBottom:2 }}>Sobre mí</div><p style={{ fontSize:5.5, color:'#ccc', lineHeight:1.5, marginBottom:5 }}>{d.perfil}</p></>}
        <div style={{ fontSize:6, fontWeight:700, color, textTransform:'uppercase', marginBottom:2 }}>Contacto</div>
        {d.telefono&&<div style={{ fontSize:5.5, color:'#ddd', marginBottom:1.5 }}>Tel: {d.telefono}</div>}
        {d.email&&<div style={{ fontSize:5.5, color:'#ddd', marginBottom:1.5 }}>{d.email}</div>}
        {d.ciudad&&<div style={{ fontSize:5.5, color:'#ddd', marginBottom:5 }}>{d.ciudad}</div>}
        {d.habilidades&&<><div style={{ fontSize:6, fontWeight:700, color, textTransform:'uppercase', marginBottom:3 }}>Habilidades</div>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ marginBottom:4 }}><div style={{ fontSize:5.5, color:'#ddd', marginBottom:1.5 }}>{h}</div><div style={{ height:3, background:'#444', borderRadius:2 }}><div style={{ height:'100%', width:`${75-(i%3)*15}%`, background:color, borderRadius:2 }}/></div></div>)}</>}
        {d.idiomas&&<><div style={{ fontSize:6, fontWeight:700, color, textTransform:'uppercase', marginTop:5, marginBottom:2 }}>Idiomas</div>{d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:5.5, color:'#ddd', marginBottom:1.5 }}>{h}</div>)}</>}
      </div>
      <div style={{ flex:1, padding:'8px 9px' }}>
        <div style={{ fontSize:13, fontWeight:900, color:'#111', lineHeight:1.1, marginBottom:5 }}>{d.nombre||'NOMBRE APELLIDO'}</div>
        <div style={{ fontSize:7, fontWeight:700, color, marginBottom:6 }}>{d.cargo||'Cargo / Puesto'}</div>
        {d.experiencia?.[0]?.cargo&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`1.5px solid ${color}`, paddingBottom:2, marginBottom:5 }}>Experiencia</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:6 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.cargo} | {e.empresa}</div><div style={{ fontSize:6, color:'#888', marginBottom:2 }}>{periodo(e)}{e.ciudad&&` · ${e.ciudad}`}</div>{e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:6, color:'#555' }}>• {f}</div>)}</div>)}</>}
        {d.educacion?.[0]?.titulo&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`1.5px solid ${color}`, paddingBottom:2, marginBottom:5, marginTop:6 }}>Formación</div>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:5 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.titulo} / {e.institucion}</div><div style={{ fontSize:6, color:'#888' }}>{periodo(e)}</div></div>)}</>}
        {d.cursos?.[0]?.nombre&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', borderBottom:`1.5px solid ${color}`, paddingBottom:2, marginBottom:5, marginTop:6 }}>Cursos</div>{d.cursos.filter(c=>c.nombre).map((c,i)=><div key={i} style={{ fontSize:6.5, color:'#333', marginBottom:3 }}><span style={{ fontWeight:700 }}>{c.nombre}</span>{c.institucion&&<span style={{ color:'#888' }}> — {c.institucion}</span>}{c.anio&&<span style={{ color:'#aaa' }}> ({c.anio})</span>}</div>)}</>}
      </div>
    </div>
  )
}

function P4({ d, color, ff }) {
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', overflow:'hidden' }}>
      <div style={{ width:'30%', background:color, padding:'8px 6px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', overflow:'hidden', margin:'0 auto 5px', border:'2px solid rgba(255,255,255,0.5)' }}>
          {d.fotoBase64?<img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:<div style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', fontSize:20 }}>👤</div>}
        </div>
        <div style={{ fontSize:7, fontWeight:700, color:'#fff', textAlign:'center', marginBottom:4 }}>{d.cargo||'Puesto'}</div>
        <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.3)', paddingTop:4, width:'100%' }}>
          {[d.telefono,d.email,d.ciudad,d.linkedin].filter(Boolean).map((c,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.85)', marginBottom:1.5, textAlign:'center', wordBreak:'break-all' }}>{c}</div>)}
        </div>
        {d.perfil&&<><div style={{ fontSize:6, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', marginTop:6, marginBottom:2, textAlign:'center' }}>Perfil</div><p style={{ fontSize:5.5, color:'rgba(255,255,255,0.8)', lineHeight:1.5, textAlign:'center' }}>{d.perfil}</p></>}
        {d.idiomas&&<><div style={{ fontSize:6, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', marginTop:6, marginBottom:2, textAlign:'center' }}>Idiomas</div>{d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.8)', marginBottom:1.5, textAlign:'center' }}>{h}</div>)}</>}
      </div>
      <div style={{ flex:1, padding:'8px 9px' }}>
        <div style={{ fontSize:15, fontWeight:900, color:'#111', marginBottom:5 }}>{d.nombre||'NOMBRE APELLIDO'}</div>
        {d.habilidades&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Competencias</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'2px 6px', marginBottom:6 }}>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i}><div style={{ fontSize:6, color:'#333', marginBottom:1 }}>{h}</div><div style={{ height:2.5, background:'#eee', borderRadius:1 }}><div style={{ height:'100%', width:`${80-(i%3)*15}%`, background:color, borderRadius:1 }}/></div></div>)}</div></>}
        {d.experiencia?.[0]?.cargo&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Experiencia</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:5, display:'flex', gap:5 }}><div style={{ width:34, flexShrink:0, fontSize:5.5, color:'#888', lineHeight:1.7 }}><div>{e.mesInicio&&`${e.mesInicio}/${e.anioInicio}`}</div><div>{e.actual?'Actual':(e.mesFin?`${e.mesFin}/${e.anioFin}`:'')}</div>{e.ciudad&&<div style={{ fontStyle:'italic' }}>{e.ciudad}</div>}</div><div style={{ flex:1 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.cargo}</div><div style={{ fontSize:6, color }}>{e.empresa}</div>{e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:6, color:'#555' }}>• {f}</div>)}</div></div>)}</>}
        {d.educacion?.[0]?.titulo&&<><div style={{ fontSize:7, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, marginTop:5 }}>Formación</div>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:4, display:'flex', gap:5 }}><div style={{ width:34, flexShrink:0, fontSize:5.5, color:'#888', lineHeight:1.7 }}><div>{e.mesInicio&&`${e.mesInicio}/${e.anioInicio}`}</div><div>{e.actual?'Actual':(e.mesFin?`${e.mesFin}/${e.anioFin}`:'')}</div></div><div><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:6, color }}>{e.institucion}</div></div></div>)}</>}
      </div>
    </div>
  )
}

function P5({ d, color, ff }) {
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', display:'flex', overflow:'hidden' }}>
      <div style={{ width:'34%', padding:'8px 7px', borderRight:'0.5px solid #eee', display:'flex', flexDirection:'column' }}>
        {d.fotoBase64&&<div style={{ width:56, height:56, borderRadius:'50%', overflow:'hidden', margin:'0 auto 7px', border:`2px solid ${color}` }}><img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>}
        <div style={{ fontSize:6, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Perfil profesional</div>
        {d.perfil&&<p style={{ fontSize:6, color:'#555', lineHeight:1.6, marginBottom:5 }}>{d.perfil}</p>}
        <div style={{ fontSize:6, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Idiomas</div>
        {d.idiomas&&d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:6.5, marginBottom:2 }}>{h}</div>)}
        <div style={{ fontSize:6, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:5, marginBottom:3 }}>Habilidades</div>
        {d.habilidades&&d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:6, color:'#444', marginBottom:2 }}>{h}</div>)}
        {d.cursos?.[0]?.nombre&&<><div style={{ fontSize:6, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:5, marginBottom:3 }}>Cursos</div>{d.cursos.filter(c=>c.nombre).map((c,i)=><div key={i} style={{ fontSize:6, color:'#444', marginBottom:3 }}><div style={{ fontWeight:600 }}>{c.nombre}</div>{c.institucion&&<div style={{ color:'#888' }}>{c.institucion}</div>}</div>)}</>}
      </div>
      <div style={{ flex:1, padding:'8px 9px' }}>
        <div style={{ fontSize:16, fontWeight:900, color:'#111', lineHeight:1.1, marginBottom:2 }}>{d.nombre||'JUAN PÉREZ'}</div>
        <div style={{ fontSize:7, color, fontWeight:600, marginBottom:2 }}>{d.cargo||''}</div>
        <div style={{ fontSize:6, color:'#888', marginBottom:6 }}>{[d.email,d.telefono].filter(Boolean).join(' · ')}</div>
        <div style={{ height:0.5, background:'#ddd', marginBottom:6 }}/>
        {d.experiencia?.[0]?.cargo&&<><div style={{ fontSize:6.5, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Experiencia Profesional</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:6, display:'flex', justifyContent:'space-between', gap:5 }}><div style={{ flex:1 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.cargo}</div><div style={{ fontSize:6, color:'#888' }}>{e.empresa}{e.ciudad&&` · ${e.ciudad}`}</div>{e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:6, color:'#555' }}>• {f}</div>)}</div><div style={{ fontSize:5.5, color:'#aaa', textAlign:'right', flexShrink:0 }}>{periodo(e)}</div></div>)}</>}
        {d.educacion?.[0]?.titulo&&<><div style={{ fontSize:6.5, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4, marginTop:5 }}>Formación</div>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:5, display:'flex', justifyContent:'space-between', gap:5 }}><div><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:6, color:'#888' }}>{e.institucion}</div></div><div style={{ fontSize:5.5, color:'#aaa', textAlign:'right', flexShrink:0 }}>{e.anioInicio&&e.anioFin?`${e.anioInicio} — ${e.anioFin}`:e.anioInicio||''}</div></div>)}</>}
      </div>
    </div>
  )
}

function P6({ d, color, ff }) {
  const tS = { fontSize:7.5, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4, marginTop:7 }
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:'#fff', padding:'8px 11px', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:`2px solid ${color}`, paddingBottom:6, marginBottom:6 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:900, color:'#111' }}>{d.nombre||'Nombre APELLIDO'}</div>
          <div style={{ fontSize:7.5, fontWeight:700, color:'#555', marginTop:2 }}>{d.cargo||'Puesto'}</div>
          <div style={{ fontSize:6, color:'#888', marginTop:3, lineHeight:1.8 }}>
            {d.telefono&&<span style={{ marginRight:8 }}>Tel: {d.telefono}</span>}{d.email&&<span style={{ marginRight:8 }}>{d.email}</span>}{d.ciudad&&<span>{d.ciudad}</span>}
          </div>
        </div>
        {d.fotoBase64&&<div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', border:`2px solid ${color}`, flexShrink:0, marginLeft:8 }}><img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>}
      </div>
      {d.habilidades&&<><div style={tS}>Habilidades</div><div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:5 }}>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><span key={i} style={{ fontSize:6, padding:'1px 5px', background:`${color}15`, border:`0.5px solid ${color}`, borderRadius:10, color }}>{h}</span>)}</div></>}
      {d.educacion?.[0]?.titulo&&<><div style={tS}>Educación</div>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:4, display:'flex', gap:5 }}><div style={{ width:28, fontSize:5.5, color:'#888' }}>{e.anioInicio&&e.anioFin?`${e.anioInicio}-${e.anioFin}`:e.anioInicio||''}</div><div><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.titulo}</div><div style={{ fontSize:6, color:'#888', fontStyle:'italic' }}>{e.institucion}</div></div></div>)}</>}
      {d.experiencia?.[0]?.cargo&&<><div style={tS}>Experiencia Profesional</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:5, display:'flex', gap:5 }}><div style={{ width:28, fontSize:5.5, color:'#888', lineHeight:1.7 }}><div>{e.mesInicio&&`${e.mesInicio}/${e.anioInicio}`}</div><div>{e.actual?'Actual':(e.mesFin?`${e.mesFin}/${e.anioFin}`:'')}</div>{e.ciudad&&<div style={{ fontStyle:'italic' }}>{e.ciudad}</div>}</div><div style={{ flex:1 }}><div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{e.empresa}</div><div style={{ fontSize:6.5 }}>{e.cargo}</div>{e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:6, color:'#555' }}>• {f}</div>)}</div></div>)}</>}
    </div>
  )
}

function P7({ d, color, ff }) {
  const cb = color+'18'
  return (
    <div style={{ width:'100%', height:'100%', fontFamily:ff, background:cb, display:'flex', overflow:'hidden' }}>
      <div style={{ width:'32%', background:color, padding:'8px 6px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ fontSize:6.5, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', marginBottom:5 }}>Contacto</div>
        {d.fotoBase64&&<div style={{ width:56, height:56, borderRadius:'50%', overflow:'hidden', margin:'0 auto 6px', border:'2px solid rgba(255,255,255,0.5)' }}><img src={d.fotoBase64} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>}
        {[d.telefono,d.email,d.ciudad,d.linkedin].filter(Boolean).map((c,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.85)', textAlign:'center', marginBottom:1.5, wordBreak:'break-all' }}>{c}</div>)}
        {d.habilidades&&<><div style={{ fontSize:6.5, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', marginTop:7, marginBottom:3 }}>Habilidades</div>{d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.8)', marginBottom:1.5 }}>• {h}</div>)}</>}
        {d.idiomas&&<><div style={{ fontSize:6.5, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', marginTop:7, marginBottom:3 }}>Idiomas</div>{d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.8)', marginBottom:1.5 }}>{h}</div>)}</>}
        {d.cursos?.[0]?.nombre&&<><div style={{ fontSize:6.5, fontWeight:700, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', marginTop:7, marginBottom:3 }}>Cursos</div>{d.cursos.filter(c=>c.nombre).map((c,i)=><div key={i} style={{ fontSize:5.5, color:'rgba(255,255,255,0.8)', marginBottom:3, textAlign:'center' }}><div style={{ fontWeight:600 }}>{c.nombre}</div>{c.institucion&&<div>{c.institucion}</div>}</div>)}</>}
      </div>
      <div style={{ flex:1, background:'#fff', padding:'8px 9px' }}>
        <div style={{ marginBottom:6, paddingBottom:5, borderBottom:`2px solid ${color}` }}>
          <div style={{ fontSize:14, fontWeight:900, color:'#111' }}>{d.nombre||'MARÍA GÓMEZ'}</div>
          <div style={{ fontSize:7.5, color, fontWeight:600, letterSpacing:'0.06em', marginTop:1 }}>{d.cargo||'Cargo'}</div>
        </div>
        {d.perfil&&<div style={{ marginBottom:6, padding:'4px 6px', background:cb, borderRadius:3 }}><p style={{ fontSize:6, color:'#444', lineHeight:1.6, textAlign:'center' }}>{d.perfil}</p></div>}
        {d.experiencia?.[0]?.cargo&&<><div style={{ fontSize:7, fontWeight:700, color:'#111', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:4 }}>Experiencia Profesional</div>{d.experiencia.filter(e=>e.cargo).map((e,i)=><div key={i} style={{ marginBottom:6 }}><div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:1 }}><div style={{ width:7, height:7, borderRadius:'50%', border:`1.5px solid ${color}`, flexShrink:0 }}/><div style={{ fontSize:6.5 }}>{e.cargo} | <span style={{ fontWeight:700 }}>{e.empresa}</span></div></div><div style={{ fontSize:5.5, color:'#888', marginLeft:11, marginBottom:1 }}>{periodo(e)}{e.ciudad&&` · ${e.ciudad}`}</div>{e.funciones&&e.funciones.split('\n').filter(Boolean).map((f,j)=><div key={j} style={{ fontSize:6, color:'#555', marginLeft:11 }}>• {f}</div>)}</div>)}</>}
        {d.educacion?.[0]?.titulo&&<><div style={{ fontSize:7, fontWeight:700, color:'#111', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:4, marginTop:5 }}>Formación Académica</div>{d.educacion.filter(e=>e.titulo).map((e,i)=><div key={i} style={{ marginBottom:4, display:'flex', alignItems:'flex-start', gap:4 }}><div style={{ width:7, height:7, borderRadius:'50%', border:`1.5px solid ${color}`, flexShrink:0, marginTop:1 }}/><div><div style={{ fontSize:6.5, fontWeight:700 }}>{e.titulo} | <span style={{ fontWeight:400 }}>{e.institucion}</span></div><div style={{ fontSize:5.5, color:'#888' }}>{e.anioInicio&&e.anioFin?`${e.anioInicio} — ${e.anioFin}`:e.anioInicio||''}</div></div></div>)}</>}
      </div>
    </div>
  )
}

// Plantillas adicionales (mis 4)
function PClasica({ d, color, ff }) {
  return <P1 d={d} color={color} ff={ff} />
}
function PModerna({ d, color, ff }) {
  return <P4 d={d} color={color} ff={ff} />
}
function PMinimalista({ d, color, ff }) {
  return <P5 d={d} color={color} ff={ff} />
}
function PEjecutiva({ d, color, ff }) {
  return <P6 d={d} color={color} ff={ff} />
}

// ─── CATÁLOGO DE PLANTILLAS ───────────────────────────────────────────────────
const PLANTILLAS = [
  { id:'p1', nombre:'Formal Completa', desc:'2 col · sidebar · sin foto', color:'#003DA5', comp: P1 },
  { id:'p2', nombre:'Profesional', desc:'1 col · con foto · habilidades 3 col', color:'#2C3E50', comp: P2 },
  { id:'p3', nombre:'Creativa Oscura', desc:'2 col · sidebar oscuro · con foto', color:'#1E8449', comp: P3 },
  { id:'p4', nombre:'Corporativa', desc:'2 col · sidebar color · con foto', color:'#154360', comp: P4 },
  { id:'p5', nombre:'Minimalista', desc:'2 col · líneas suaves · con foto opcional', color:'#555555', comp: P5 },
  { id:'p6', nombre:'Ejecutiva', desc:'1 col · foto circular · encabezado color', color:'#003DA5', comp: P6 },
  { id:'p7', nombre:'Premium', desc:'2 col · fondo suave · con foto', color:'#117A65', comp: P7 },
]

// ─── PREVIEW WRAPPER ──────────────────────────────────────────────────────────
function PreviewCV({ datos, plantillaId, color, fuente, letraSize }) {
  const Comp = PLANTILLAS.find(p => p.id === plantillaId)?.comp || P1
  const ff = FUENTES.find(f => f.id === fuente)?.css || 'Arial, sans-serif'
  const scale = letraSize === 'pequeño' ? 0.88 : letraSize === 'grande' ? 1.12 : 1
  return (
    <div style={{ width:'100%', height:'100%', fontSize: `${scale}em` }}>
      <Comp d={datos} color={color} ff={ff} />
    </div>
  )
}

// ─── GENERADORES PDF ──────────────────────────────────────────────────────────
function generarPDF(datos, plantillaId, color, fuente, tamano, letraSize) {
  const fmt = tamano === 'carta' ? [215.9, 279.4] : 'a4'
  const doc = new jsPDF({ unit:'mm', format:fmt })
  const [pr,pg,pb] = hexToRgb(color)
  const fn = fuente
  // Escala de tamaño de letra aplicada a los tamaños de fuente del PDF
  const ls = letraSize === 'pequeño' ? 0.88 : letraSize === 'grande' ? 1.12 : 1

  // Helper compartidos
  const sec = (t, x, y, w, col=[pr,pg,pb]) => {
    doc.setFontSize(8.5*ls); doc.setFont(fn,'bold'); doc.setTextColor(...col)
    doc.text(t.toUpperCase(), x, y); y+=2
    doc.setDrawColor(...col); doc.setLineWidth(0.4); doc.line(x,y,x+w,y); y+=6
    return y
  }
  const txt = (t, x, y, w, size=9) => {
    if(!t) return y
    doc.setFontSize(size*ls); doc.setFont(fn,'normal'); doc.setTextColor(60,60,60)
    doc.splitTextToSize(t,w).forEach(l=>{ doc.text(l,x,y); y+=5*ls })
    return y
  }

  switch(plantillaId) {
    case 'p1': return pdf_p1(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p2': return pdf_p2(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p3': return pdf_p3(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p4': return pdf_p4(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p5': return pdf_p5(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p6': return pdf_p6(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    case 'p7': return pdf_p7(doc,datos,pr,pg,pb,fn,sec,txt,ls)
    default:   return pdf_p1(doc,datos,pr,pg,pb,fn,sec,txt,ls)
  }
}

function pdf_p1(doc,d,pr,pg,pb,fn,sec,txt,ls=1) {
  doc.setFontSize(26*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text((d.nombre||'NOMBRE').toUpperCase(),14,18)
  doc.setFontSize(9);doc.setFont(fn,'normal');doc.setTextColor(pr,pg,pb);doc.text((d.cargo||'').toUpperCase(),14,25)
  doc.setFontSize(7.5);doc.setTextColor(80,80,80)
  const cs=[d.direccion,d.telefono&&`Tel: ${d.telefono}`,d.email].filter(Boolean).join('   -   ')
  doc.text(cs,14,31);doc.setDrawColor(pr,pg,pb);doc.setLineWidth(0.8);doc.line(14,34,196,34)
  const xL=14,wL=116,xR=136,wR=56
  let yL=42, yR=42
  // Fondo sidebar derecha
  doc.setFillColor(pr,pg,pb);doc.setGState(doc.GState({opacity:0.07}));doc.rect(xR-4,34,wR+8,263,'F');doc.setGState(doc.GState({opacity:1}))

  // Helpers columna izquierda
  const sL=(t)=>{if(yL>275){doc.addPage();yL=15};doc.setFontSize(8*ls);doc.setFont(fn,'bold');doc.setTextColor(pr,pg,pb);doc.text(t.toUpperCase(),xL,yL);yL+=2;doc.setDrawColor(pr,pg,pb);doc.setLineWidth(0.3);doc.line(xL,yL,xL+wL,yL);yL+=5}
  // Helpers columna derecha
  const sR=(t)=>{if(yR>280)return;doc.setFontSize(8*ls);doc.setFont(fn,'bold');doc.setTextColor(pr,pg,pb);doc.text(t.toUpperCase(),xR,yR);yR+=2;doc.setDrawColor(pr,pg,pb);doc.setLineWidth(0.3);doc.line(xR,yR,xR+wR,yR);yR+=5}
  const iR=(t)=>{if(!t||yR>280)return;doc.setFontSize(7.5*ls);doc.setFont(fn,'normal');doc.setTextColor(40,40,40);doc.splitTextToSize(t,wR).forEach(l=>{if(yR<283){doc.text(l,xR,yR);yR+=4.5*ls}})}

  // ── COLUMNA IZQUIERDA ──
  // Perfil ocupacional
  if(d.perfil){
    sL('Perfil Ocupacional')
    doc.setFontSize(8.5*ls);doc.setFont(fn,'normal');doc.setTextColor(60,60,60)
    doc.splitTextToSize(d.perfil,wL).forEach(l=>{if(yL>275){doc.addPage();yL=15};doc.text(l,xL,yL);yL+=5*ls})
    yL+=3
  }

  // Experiencia
  const expV=(d.experiencia||[]).filter(e=>e.cargo)
  if(expV.length){
    sL('Experiencia Profesional')
    expV.forEach(e=>{
      if(yL>275){doc.addPage();yL=15}
      const p1=e.mesInicio&&e.anioInicio?`${e.mesInicio}/${e.anioInicio}`:'',p2=e.actual?'Actual':(e.mesFin&&e.anioFin?`${e.mesFin}/${e.anioFin}`:'')
      // Fecha al margen izquierdo
      doc.setFontSize(7*ls);doc.setFont(fn,'normal');doc.setTextColor(pr,pg,pb)
      if(p1)doc.text(p1,xL,yL)
      if(p2)doc.text(p2,xL,yL+4*ls)
      if(e.ciudad)doc.text(e.ciudad,xL,yL+8*ls)
      // Empresa y cargo
      doc.setFontSize(8.5*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(e.empresa||'',xL+30,yL);yL+=5*ls
      doc.setFont(fn,'italic');doc.setFontSize(8*ls);doc.setTextColor(80,80,80);doc.text(e.cargo||'',xL+30,yL);yL+=5*ls
      // Funciones con viñetas
      if(e.funciones)e.funciones.split('\n').filter(Boolean).forEach(f=>{
        doc.setFontSize(8*ls);doc.setFont(fn,'normal');doc.setTextColor(60,60,60)
        doc.setFillColor(pr,pg,pb);doc.circle(xL+31,yL-1,1,'F')
        doc.splitTextToSize(f,wL-34).forEach(l=>{if(yL>278){doc.addPage();yL=15};doc.text(l,xL+34,yL);yL+=4.5*ls})
      })
      // Logros en cursiva
      if(e.logros){
        doc.setFont(fn,'italic');doc.setFontSize(8*ls);doc.setTextColor(90,90,90)
        doc.splitTextToSize(e.logros,wL-32).forEach(l=>{doc.text(l,xL+30,yL);yL+=4.5*ls})
      }
      yL+=3
    })
  }

  // Estudios
  const eduV=(d.educacion||[]).filter(e=>e.titulo)
  if(eduV.length){
    sL('Estudios')
    eduV.forEach(e=>{
      if(yL>275){doc.addPage();yL=15}
      doc.setFontSize(7*ls);doc.setFont(fn,'normal');doc.setTextColor(pr,pg,pb)
      if(e.anioInicio)doc.text(e.anioInicio,xL,yL)
      doc.setFontSize(8.5*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(e.titulo||'',xL+30,yL);yL+=5*ls
      doc.setFont(fn,'italic');doc.setFontSize(8*ls);doc.setTextColor(80,80,80)
      doc.text(`${e.institucion||''}${e.ciudad?' · '+e.ciudad:''}`,xL+30,yL);yL+=7*ls
    })
  }

  // ── COLUMNA DERECHA (sidebar) ──
  if(d.habilidades){sR('Habilidades');d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{iR(h);yR+=1});yR+=4}
  if(d.idiomas){sR('Idiomas');d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{iR(h);yR+=1});yR+=4}
  const cV=(d.cursos||[]).filter(c=>c.nombre)
  if(cV.length){
    sR('Cursos')
    cV.forEach(c=>{
      if(yR>278)return
      doc.setFontSize(7.5*ls);doc.setFont(fn,'bold');doc.setTextColor(30,30,30)
      doc.splitTextToSize(c.nombre,wR).forEach(l=>{if(yR<280){doc.text(l,xR,yR);yR+=4.5*ls}})
      if(c.institucion){
        doc.setFont(fn,'normal');doc.setFontSize(7*ls);doc.setTextColor(90,90,90)
        doc.text(c.institucion,xR,yR);yR+=4*ls
      }
      if(c.anio){doc.setFontSize(7*ls);doc.setTextColor(130,130,130);doc.text(c.anio,xR,yR);yR+=4*ls}
      yR+=2
    })
  }
  doc.save(`CV_${d.nombre||'MiCV'}.pdf`)
}

function pdf_p2(doc,d,pr,pg,pb,fn,sec,txt,ls=1) {
  if(d.fotoBase64){try{doc.addImage(d.fotoBase64,'JPEG',168,10,28,32)}catch(e){}}
  doc.setFontSize(22);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(d.nombre||'NOMBRE',14,20)
  doc.setFontSize(10);doc.setFont(fn,'normal');doc.setTextColor(80,80,80);doc.text(d.cargo||'',14,27)
  doc.setFontSize(8);doc.setTextColor(100,100,100);[d.telefono,d.email,d.ciudad].filter(Boolean).forEach((c,i)=>doc.text(c,14+i*62,33))
  doc.setDrawColor(200,200,200);doc.setLineWidth(0.4);doc.line(14,37,196,37)
  let y=44
  if(d.perfil){y=sec('Perfil',14,y,182,[80,80,80]);doc.setFontSize(9);doc.setFont(fn,'normal');doc.setTextColor(60,60,60);doc.splitTextToSize(d.perfil,182).forEach(l=>{doc.text(l,14,y);y+=5});y+=3}
  if(d.habilidades){y=sec('Habilidades',14,y,182,[80,80,80]);const habs=d.habilidades.split(',').map(h=>h.trim()).filter(Boolean);const cols=[habs.filter((_,i)=>i%3===0),habs.filter((_,i)=>i%3===1),habs.filter((_,i)=>i%3===2)];const sY=y;cols.forEach((col,ci)=>{let cy=sY;col.forEach(h=>{doc.setFontSize(8.5);doc.setFont(fn,'normal');doc.setTextColor(50,50,50);doc.setFillColor(pr,pg,pb);doc.circle(14+ci*62+1.5,cy-1,1,'F');doc.text(h,14+ci*62+4,cy);cy+=5.5})});y=sY+Math.ceil(habs.length/3)*5.5+3}
  const expV=(d.experiencia||[]).filter(e=>e.cargo)
  if(expV.length){y=sec('Experiencia Profesional',14,y,182,[80,80,80]);expV.forEach(e=>{if(y>275){doc.addPage();y=15};const p1=e.mesInicio&&e.anioInicio?`${e.mesInicio}/${e.anioInicio}`:'',p2=e.actual?'Actual':(e.mesFin&&e.anioFin?`${e.mesFin}/${e.anioFin}`:'');doc.setFontSize(7.5);doc.setFont(fn,'normal');doc.setTextColor(120,120,120);if(p1)doc.text(p1,14,y);if(p2)doc.text(p2,14,y+4.5);doc.setFontSize(9);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(`${e.empresa||''} | ${e.cargo||''}`,44,y);y+=5;if(e.funciones)e.funciones.split('\n').filter(Boolean).forEach(f=>{doc.setFontSize(8);doc.setFont(fn,'normal');doc.setTextColor(60,60,60);doc.setFillColor(pr,pg,pb);doc.circle(46,y-1,1,'F');doc.splitTextToSize(f,146).forEach(l=>{doc.text(l,49,y);y+=4.5})});if(e.logros){doc.setFont(fn,'italic');doc.setTextColor(80,80,80);doc.splitTextToSize(e.logros,148).forEach(l=>{doc.text(l,44,y);y+=4.5})};y+=3})}
  const eduV=(d.educacion||[]).filter(e=>e.titulo)
  if(eduV.length){y=sec('Educación',14,y,182,[80,80,80]);const cols3=[[],[],[]];eduV.forEach((e,i)=>cols3[i%3].push(e));const sY=y;cols3.forEach((col,ci)=>{let cy=sY;col.forEach(e=>{doc.setFontSize(8.5);doc.setFont(fn,'bold');doc.setTextColor(30,30,30);doc.text(e.titulo||'',14+ci*62,cy);cy+=5;doc.setFont(fn,'normal');doc.setFontSize(8);doc.setTextColor(100,100,100);doc.text(`${e.institucion||''}${e.anioInicio?' · '+e.anioInicio:''}`,14+ci*62,cy);cy+=7})});y=sY+eduV.length*12+3}
  doc.save(`CV_${d.nombre||'MiCV'}.pdf`)
}

function pdf_generico(doc,d,pr,pg,pb,fn,aL,dark,ls=1) {
  const xM=aL+7,wM=210-aL-12
  if(dark){doc.setFillColor(43,43,43)}else{doc.setFillColor(pr,pg,pb)}
  doc.rect(0,0,aL,297,'F')
  let yL=10
  if(d.fotoBase64){try{doc.addImage(d.fotoBase64,'JPEG',5,yL,aL-10,55);yL+=60}catch(e){yL+=10}}
  const tC=dark?[200,200,200]:[255,255,255]
  const sL=(t)=>{if(yL>282)return;doc.setFontSize(7.5*ls);doc.setFont(fn,'bold');doc.setTextColor(...tC);doc.setGState(doc.GState({opacity:0.75}));doc.text(t.toUpperCase(),5,yL);doc.setGState(doc.GState({opacity:1}));yL+=2;doc.setDrawColor(...tC);doc.setLineWidth(0.3);doc.setGState(doc.GState({opacity:0.3}));doc.line(5,yL,aL-4,yL);doc.setGState(doc.GState({opacity:1}));yL+=4}
  const iL=(t)=>{if(!t||yL>282)return;doc.setFontSize(7.5*ls);doc.setFont(fn,'normal');doc.setTextColor(...tC);doc.setGState(doc.GState({opacity:0.85}));doc.splitTextToSize(t,aL-8).forEach(l=>{if(yL<283){doc.text(l,5,yL);yL+=4.5*ls}});doc.setGState(doc.GState({opacity:1}));yL+=1}
  doc.setFontSize(10*ls);doc.setFont(fn,'bold');doc.setTextColor(...tC);doc.splitTextToSize(d.nombre||'NOMBRE',aL-8).forEach(l=>{doc.text(l,5,yL);yL+=6*ls})
  doc.setFontSize(8*ls);doc.setFont(fn,'italic');doc.text(d.cargo||'',5,yL);yL+=6*ls
  sL('Contacto');[d.telefono&&`Tel: ${d.telefono}`,d.email,d.ciudad,d.linkedin].filter(Boolean).forEach(iL);yL+=3
  if(d.habilidades){sL('Habilidades');d.habilidades.split(',').map(h=>h.trim()).filter(Boolean).forEach(h=>{if(dark){if(yL>280)return;doc.setGState(doc.GState({opacity:0.15}));doc.setFillColor(255,255,255);doc.roundedRect(5,yL-3,aL-10,6,1,1,'F');doc.setGState(doc.GState({opacity:1}))};iL(h);yL+=dark?1.5:0});yL+=2}
  if(d.idiomas){sL('Idiomas');d.idiomas.split(',').map(h=>h.trim()).filter(Boolean).forEach(iL);yL+=2}
  const cV=(d.cursos||[]).filter(c=>c.nombre);if(cV.length){sL('Cursos');cV.forEach(c=>{iL(c.nombre);if(c.institucion)iL(c.institucion);yL+=1})}
  let yM=15
  doc.setFontSize(18*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(d.nombre||'NOMBRE',xM,yM);yM+=7*ls
  doc.setFontSize(9*ls);doc.setFont(fn,'bold');doc.setTextColor(pr,pg,pb);doc.text(d.cargo||'',xM,yM);yM+=6*ls
  doc.setDrawColor(pr,pg,pb);doc.setLineWidth(0.5);doc.line(xM,yM,196,yM);yM+=6
  if(d.perfil){doc.setFontSize(9*ls);doc.setFont(fn,'normal');doc.setTextColor(60,60,60);doc.splitTextToSize(d.perfil,wM).forEach(l=>{doc.text(l,xM,yM);yM+=5*ls});yM+=3}
  const sM=(t)=>{if(yM>278){doc.addPage();yM=15};doc.setFontSize(9*ls);doc.setFont(fn,'bold');doc.setTextColor(pr,pg,pb);doc.text(t.toUpperCase(),xM,yM);yM+=2;doc.setDrawColor(pr,pg,pb);doc.setLineWidth(0.4);doc.line(xM,yM,196,yM);yM+=6}
  const expV=(d.experiencia||[]).filter(e=>e.cargo)
  if(expV.length){sM('Experiencia Laboral');expV.forEach(e=>{if(yM>275){doc.addPage();yM=15};doc.setFontSize(9.5*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(e.cargo||'',xM,yM);yM+=5*ls;doc.setFont(fn,'italic');doc.setFontSize(8.5*ls);doc.setTextColor(pr,pg,pb);doc.text(`${e.empresa||''}${e.ciudad?' · '+e.ciudad:''}`,xM,yM);yM+=4*ls;doc.setFont(fn,'normal');doc.setFontSize(7.5*ls);doc.setTextColor(120,120,120);doc.text(periodo(e),xM,yM);yM+=5*ls;if(e.funciones)e.funciones.split('\n').filter(Boolean).forEach(f=>{doc.setFontSize(8.5*ls);doc.setFont(fn,'normal');doc.setTextColor(60,60,60);doc.setFillColor(pr,pg,pb);doc.circle(xM+1.5,yM-1,1,'F');doc.splitTextToSize(f,wM-6).forEach(l=>{doc.text(l,xM+5,yM);yM+=4.5*ls})});if(e.logros){doc.setFont(fn,'italic');doc.setTextColor(80,80,80);doc.splitTextToSize(e.logros,wM-4).forEach(l=>{doc.text(l,xM+2,yM);yM+=4.5*ls})};yM+=3})}
  const eduV=(d.educacion||[]).filter(e=>e.titulo)
  if(eduV.length){sM('Educación');eduV.forEach(e=>{if(yM>275){doc.addPage();yM=15};doc.setFontSize(9.5*ls);doc.setFont(fn,'bold');doc.setTextColor(20,20,20);doc.text(e.titulo||'',xM,yM);yM+=5*ls;doc.setFont(fn,'normal');doc.setFontSize(8.5*ls);doc.setTextColor(pr,pg,pb);doc.text(`${e.institucion||''}${e.ciudad?' · '+e.ciudad:''}`,xM,yM);yM+=4*ls;doc.setFontSize(7.5*ls);doc.setTextColor(120,120,120);doc.text(periodo(e),xM,yM);yM+=7*ls})}
  doc.save(`CV_${d.nombre||'MiCV'}.pdf`)
}

const pdf_p3=(doc,d,pr,pg,pb,fn,sec,txt,ls)=>pdf_generico(doc,d,pr,pg,pb,fn,64,true,ls)
const pdf_p4=(doc,d,pr,pg,pb,fn,sec,txt,ls)=>pdf_generico(doc,d,pr,pg,pb,fn,60,false,ls)
const pdf_p5=(doc,d,pr,pg,pb,fn,sec,txt,ls)=>pdf_generico(doc,d,pr,pg,pb,fn,64,false,ls)
const pdf_p6=(doc,d,pr,pg,pb,fn,sec,txt,ls)=>pdf_generico(doc,d,pr,pg,pb,fn,60,false,ls)
const pdf_p7=(doc,d,pr,pg,pb,fn,sec,txt,ls)=>pdf_generico(doc,d,pr,pg,pb,fn,62,false,ls)

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CrearCV() {
  const location = useLocation()
  const plantillaInicial = location.state?.plantilla

  const [paso, setPaso] = useState('selector')
  const [datos, setDatos] = useState(INICIAL)
  const [mejorando, setMejorando] = useState({})
  const [config, setConfig] = useState({
    plantillaId: plantillaInicial?.id || 'p1',
    color: plantillaInicial?.config?.colorPrimario || '#003DA5',
    fuente: 'helvetica',
    tamano: 'a4',
    letraSize: 'normal',
  })

  const act = (k,v) => setDatos(d=>({...d,[k]:v}))
  const actCfg = (k,v) => setConfig(c=>({...c,[k]:v}))
  const actExp = (i,k,v) => { const e=[...datos.experiencia]; e[i][k]=v; setDatos(d=>({...d,experiencia:e})) }
  const actEdu = (i,k,v) => { const e=[...datos.educacion]; e[i][k]=v; setDatos(d=>({...d,educacion:e})) }
  const actCur = (i,k,v) => { const c=[...datos.cursos]; c[i][k]=v; setDatos(d=>({...d,cursos:c})) }

  const mejorar = async (campo, texto, tipo) => {
    if(!texto.trim()) return
    setMejorando(m=>({...m,[campo]:true}))
    const m = await mejorarTexto(texto, tipo)
    act(campo,m)
    setMejorando(m=>({...m,[campo]:false}))
  }

  const cargarFoto = (e) => {
    const f=e.target.files[0]; if(!f) return
    const r=new FileReader(); r.onload=ev=>act('fotoBase64',ev.target.result); r.readAsDataURL(f)
  }

  const descargar = () => generarPDF(datos, config.plantillaId, config.color, config.fuente, config.tamano, config.letraSize)

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

  const plantillaActual = PLANTILLAS.find(p=>p.id===config.plantillaId) || PLANTILLAS[0]

  // ── PASO SELECTOR ────────────────────────────────────────────────────────────
  if (paso === 'selector') return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--gris2)', background:'var(--blanco)' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--azul)' }}>Crear mi Hoja de Vida</h1>
        <p style={{ fontSize:13, color:'var(--texto2)', marginTop:2 }}>Elige una plantilla y personaliza el estilo</p>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

        {/* Plantillas */}
        <div style={{ fontSize:13, fontWeight:700, color:'var(--texto)', marginBottom:14 }}>1. Elige tu plantilla</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:28 }}>
          {PLANTILLAS.map(p => {
            const ff = FUENTES.find(f=>f.id===config.fuente)?.css||'Arial, sans-serif'
            return (
              <div key={p.id} onClick={()=>{ actCfg('plantillaId',p.id); actCfg('color',p.color) }}
                style={{ border:`2px solid ${config.plantillaId===p.id?'var(--azul)':'var(--gris2)'}`, borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', transform:config.plantillaId===p.id?'translateY(-2px)':'none', boxShadow:config.plantillaId===p.id?'0 6px 20px rgba(0,61,165,0.15)':'none' }}>
                <div style={{ height:100, background:'#f5f5f5', overflow:'hidden', position:'relative' }}>
                  <div style={{ transform:'scale(0.28)', transformOrigin:'top left', width:'357%', height:'357%', pointerEvents:'none' }}>
                    <PreviewCV datos={{ nombre:'Laura García', cargo:'Diseñadora UX', email:'laura@email.com', telefono:'300 000 0000', ciudad:'Bogotá', direccion:'Cra 7 #45-20', linkedin:'linkedin.com/in/laura', perfil:'Profesional con 5 años de experiencia en diseño digital.', fotoBase64:'', experiencia:[{ cargo:'Diseñadora Sr', empresa:'Empresa XYZ', ciudad:'Bogotá', mesInicio:'03', anioInicio:'2021', mesFin:'', anioFin:'', actual:true, funciones:'Diseño de interfaces\nCreación de prototipos', logros:'' }], educacion:[{ titulo:'Diseño Gráfico', institucion:'Univ. Nacional', ciudad:'Bogotá', mesInicio:'01', anioInicio:'2016', mesFin:'12', anioFin:'2020', actual:false }], cursos:[{ nombre:'UX Research', institucion:'Google', anio:'2022' }], habilidades:'Figma, Photoshop, Illustrator, Liderazgo', idiomas:'Español nativo, Inglés B2' }} plantillaId={p.id} color={p.color} fuente={config.fuente} />
                  </div>
                </div>
                <div style={{ padding:'8px 10px', background:config.plantillaId===p.id?'rgba(0,61,165,0.04)':'var(--blanco)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:config.plantillaId===p.id?'var(--azul)':'var(--texto)' }}>{p.nombre}</div>
                  <div style={{ fontSize:10.5, color:'var(--texto2)' }}>{p.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Personalización */}
        <div style={{ fontSize:13, fontWeight:700, color:'var(--texto)', marginBottom:14 }}>2. Personaliza el estilo</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:28 }}>
          {/* Color */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Color principal</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:5, marginBottom:8 }}>
              {COLORES.map(c=><div key={c} onClick={()=>actCfg('color',c)} style={{ height:26, borderRadius:6, background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s', display:'flex', alignItems:'center', justifyContent:'center' }}>{config.color===c&&<span style={{ fontSize:11, color:'white' }}>✓</span>}</div>)}
            </div>
            <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} style={{ width:'100%', height:30, border:'none', borderRadius:6, cursor:'pointer', padding:2 }} />
          </div>
          {/* Fuente */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Tipo de letra</div>
            {FUENTES.map(f=><div key={f.id} onClick={()=>actCfg('fuente',f.id)} style={{ padding:'7px 9px', marginBottom:6, borderRadius:8, border:`1.5px solid ${config.fuente===f.id?'var(--azul)':'var(--gris2)'}`, background:config.fuente===f.id?'rgba(0,61,165,0.05)':'var(--gris)', cursor:'pointer', transition:'all 0.15s' }}><div style={{ fontFamily:f.css, fontSize:13, fontWeight:600, color:config.fuente===f.id?'var(--azul)':'var(--texto)' }}>{f.nombre}</div><div style={{ fontFamily:f.css, fontSize:10.5, color:'var(--texto2)' }}>Aa Bb 123</div></div>)}
          </div>
          {/* Tamaño */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8 }}>Tamaño de hoja</div>
            {[['a4','A4 (210×297mm)','Internacional'],['carta','Carta (216×279mm)','Colombia/USA']].map(([v,l,s])=><div key={v} onClick={()=>actCfg('tamano',v)} style={{ padding:'9px 10px', marginBottom:8, borderRadius:8, border:`1.5px solid ${config.tamano===v?'var(--azul)':'var(--gris2)'}`, background:config.tamano===v?'rgba(0,61,165,0.05)':'var(--gris)', cursor:'pointer', transition:'all 0.15s' }}><div style={{ fontSize:13, fontWeight:600, color:config.tamano===v?'var(--azul)':'var(--texto)' }}>{l}</div><div style={{ fontSize:10.5, color:'var(--texto2)' }}>{s}</div></div>)}
          </div>
          {/* Preview mini */}
          <div style={{ ...card, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--texto)', marginBottom:8, alignSelf:'flex-start' }}>Vista previa</div>
            <div style={{ width:'100%', aspectRatio:'210/297', background:'#f5f5f5', borderRadius:6, overflow:'hidden', border:'1px solid var(--gris2)' }}>
              <PreviewCV datos={datos} plantillaId={config.plantillaId} color={config.color} fuente={config.fuente} />
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

  // ── PASO EDITOR ──────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ borderBottom:'1px solid var(--gris2)', background:'var(--blanco)', flexShrink:0 }}>
        <div style={{ padding:'8px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--gris2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={()=>setPaso('selector')} style={{ padding:'5px 11px', background:'var(--gris)', border:'1px solid var(--gris2)', borderRadius:7, fontSize:12, cursor:'pointer', color:'var(--texto2)' }}>← Plantillas</button>
            <span style={{ fontWeight:700, fontSize:13, color:'var(--azul)' }}>{plantillaActual.nombre}</span>
            <span style={{ fontSize:11, color:'var(--texto2)' }}>· El CV se actualiza en tiempo real</span>
          </div>
          <button onClick={descargar} style={{ padding:'8px 20px', background:'var(--verde)', border:'none', borderRadius:8, color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>⬇ Descargar PDF</button>
        </div>
        <div style={{ padding:'7px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Color:</span>
          {COLORES.map(c=>(
            <div key={c} onClick={()=>actCfg('color',c)}
              style={{ width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer', border:config.color===c?'3px solid white':'2px solid transparent', boxShadow:config.color===c?`0 0 0 2px ${c}`:'none', transition:'all 0.1s', flexShrink:0 }}/>
          ))}
          <input type="color" value={config.color} onChange={e=>actCfg('color',e.target.value)} title="Color personalizado"
            style={{ width:24, height:24, border:'1px solid var(--gris2)', borderRadius:5, cursor:'pointer', padding:1 }}/>
          <div style={{ width:1, height:20, background:'var(--gris2)' }}/>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Letra:</span>
          <select value={config.fuente} onChange={e=>actCfg('fuente',e.target.value)} style={{...sel,fontSize:12,padding:'3px 7px',width:'auto'}}>
            {FUENTES.map(f=><option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          <div style={{ width:1, height:20, background:'var(--gris2)' }}/>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Tamaño:</span>
          <div style={{ display:'flex', border:'1px solid var(--gris2)', borderRadius:7, overflow:'hidden' }}>
            {[['pequeño','A',10],['normal','A',13],['grande','A',16]].map(([v,l,fs])=>(
              <button key={v} onClick={()=>actCfg('letraSize',v)}
                style={{ padding:'3px 10px', border:'none', background:config.letraSize===v?'var(--azul)':'var(--blanco)', color:config.letraSize===v?'white':'var(--texto2)', fontSize:fs, fontWeight:700, cursor:'pointer', transition:'all 0.15s', lineHeight:1.4 }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ width:1, height:20, background:'var(--gris2)' }}/>
          <span style={{ fontSize:11, color:'var(--texto2)', fontWeight:600 }}>Hoja:</span>
          <select value={config.tamano} onChange={e=>actCfg('tamano',e.target.value)} style={{...sel,fontSize:12,padding:'3px 7px',width:'auto'}}>
            <option value="a4">A4</option>
            <option value="carta">Carta</option>
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
            <div style={{ marginTop:10 }}>
              <label style={lbl}>Foto de perfil</label>
              <div onClick={()=>document.getElementById('fotoInp').click()} style={{ border:'2px dashed var(--gris2)', borderRadius:8, padding:10, textAlign:'center', cursor:'pointer', background:'#fff', display:'flex', alignItems:'center', gap:10 }}>
                {datos.fotoBase64?<img src={datos.fotoBase64} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}/>:<div style={{ fontSize:20 }}>📷</div>}
                <span style={{ fontSize:12, color:'var(--texto2)' }}>{datos.fotoBase64?'Cambiar foto':'Subir foto'}</span>
              </div>
              <input id="fotoInp" type="file" accept="image/*" style={{ display:'none' }} onChange={cargarFoto}/>
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
                  <div><label style={lbl}>Cargo</label><input value={exp.cargo} onChange={e=>actExp(i,'cargo',e.target.value)} placeholder="Cargo desempeñado" style={inp}/></div>
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
                    <button onClick={()=>{const ec=[...datos.experiencia];mejorarTexto(exp.funciones,'funciones laborales de '+exp.cargo).then(m=>{ec[i].funciones=m;setDatos(d=>({...d,experiencia:ec}))})}} disabled={!exp.funciones&&!exp.cargo}
                      style={{ padding:'3px 7px', background:'rgba(57,169,0,0.1)', border:'1px solid rgba(57,169,0,0.3)', borderRadius:5, color:'var(--verde)', fontSize:10, fontWeight:700, cursor:'pointer' }}>✨ IA</button>
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
                  <div><label style={lbl}>Título</label><input value={edu.titulo} onChange={e=>actEdu(i,'titulo',e.target.value)} placeholder="Título obtenido" style={inp}/></div>
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
                  <div><label style={lbl}>Nombre del curso</label><input value={cur.nombre} onChange={e=>actCur(i,'nombre',e.target.value)} placeholder="Nombre del curso" style={inp}/></div>
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
              <div><label style={lbl}>Habilidades (separadas por comas)</label><input value={datos.habilidades} onChange={e=>act('habilidades',e.target.value)} placeholder="Excel, Word, Liderazgo, Trabajo en equipo..." style={inp}/></div>
              <div><label style={lbl}>Idiomas</label><input value={datos.idiomas} onChange={e=>act('idiomas',e.target.value)} placeholder="Español nativo, Inglés B2, Francés básico..." style={inp}/></div>
            </div>
          </div>

          <div style={{ paddingBottom:20 }}>
            <button onClick={descargar} style={{ width:'100%', padding:12, background:'var(--verde)', border:'none', borderRadius:10, color:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Descargar CV en PDF
            </button>
          </div>
        </div>

        {/* PREVIEW EN TIEMPO REAL */}
        <div style={{ background:'#e0e0e0', display:'flex', alignItems:'flex-start', justifyContent:'center', overflow:'auto', padding:'20px' }}>
          <div style={{ width:595, minHeight:842, background:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.2)', borderRadius:3, overflow:'hidden' }}>
            <PreviewCV datos={datos} plantillaId={config.plantillaId} color={config.color} fuente={config.fuente} letraSize={config.letraSize} />
          </div>
        </div>
      </div>
    </div>
  )
}