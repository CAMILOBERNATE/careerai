import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [plantillas, setPlantillas] = useState([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', estilo: 'formal', imagen_url: '', autor: '' })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (autenticado) cargarPlantillas()
  }, [autenticado])

  const cargarPlantillas = async () => {
    setCargando(true)
    const { data } = await supabase.from('plantillas').select('*').order('id', { ascending: false })
    setPlantillas(data || [])
    setCargando(false)
  }

  const subirImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setGuardando(true)
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error } = await supabase.storage
      .from('plantillas')
      .upload(fileName, file, { contentType: file.type })
    if (error) {
      setError('❌ Error al subir imagen. Intenta de nuevo.')
      setGuardando(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('plantillas')
      .getPublicUrl(fileName)
    setForm(f => ({ ...f, imagen_url: urlData.publicUrl }))
    setGuardando(false)
  }

  const guardar = async () => {
    if (!form.nombre || !form.descripcion) { setError('⚠️ El nombre y descripción son obligatorios'); return }
    if (!form.autor) { setError('⚠️ El nombre del autor es obligatorio'); return }
    setGuardando(true)
    const { error: err } = await supabase.from('plantillas').insert([{
      nombre: form.nombre,
      descripcion: form.descripcion,
      estilo: form.estilo,
      imagen_url: form.imagen_url,
      autor: form.autor,
    }])
    if (err) { setError('❌ Error al guardar. Intenta de nuevo.'); setGuardando(false); return }
    setForm({ nombre: '', descripcion: '', estilo: 'formal', imagen_url: '', autor: '' })
    setGuardando(false)
    setExito(true)
    setError('')
    setTimeout(() => setExito(false), 3000)
    cargarPlantillas()
  }

  const eliminar = async (id) => {
    await supabase.from('plantillas').delete().eq('id', id)
    cargarPlantillas()
  }

  const entrar = async () => {
    if (!password.trim()) { setError('⚠️ Escribe tu correo'); return }
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('email', password.trim().toLowerCase())
      .single()
    if (data && (data.activo === true || data.activo === 'True' || data.activo === 'true')) {
      setAutenticado(true)
      setError('')
    } else {
      setError('❌ Correo no autorizado. Contacta a Camilo.')
    }
  }

  if (!autenticado) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gris)' }}>
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 16, padding: 36, width: 360, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)', marginBottom: 4 }}>Panel Administrador</h2>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 24 }}>Solo para el equipo de diseño</p>
          <input
            type="email"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="Tu correo @sena.edu.co"
            style={{ width: '100%', padding: '11px 14px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 9, fontSize: 14, color: 'var(--texto)', marginBottom: 12, textAlign: 'center' }}
          />
          {error && <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>}
          <button onClick={entrar} style={{ width: '100%', padding: '11px', background: 'var(--azul)', border: 'none', borderRadius: 9, color: 'var(--blanco)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Entrar →
          </button>
          <p style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 16 }}>¿No tienes acceso? Contacta a Camilo 😊</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>🎨 Panel de Plantillas</h1>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Las plantillas se guardan en la nube — todos los usuarios las ven</p>
        </div>
        <button onClick={() => setAutenticado(false)} style={{ padding: '8px 16px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, color: 'var(--texto2)', fontSize: 13, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
          <div style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 16, padding: 24, borderTop: '3px solid var(--verde)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--azul)', marginBottom: 20 }}>➕ Agregar plantilla nueva</h2>

            {[['nombre', 'Nombre de la plantilla *', 'Ej: Plantilla Ejecutiva'],
              ['autor', 'Tu nombre (autor) *', 'Ej: María García'],
              ['descripcion', 'Descripción *', 'Describe el estilo...']].map(([campo, label, placeholder]) => (
              <div key={campo} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>{label}</label>
                {campo === 'descripcion'
                  ? <textarea value={form[campo]} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))} placeholder={placeholder} rows={3}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)', resize: 'vertical' }} />
                  : <input value={form[campo]} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }} />
                }
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Estilo</label>
              <select value={form.estilo} onChange={e => setForm(f => ({ ...f, estilo: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}>
                <option value="formal">Formal / Clásico</option>
                <option value="moderno">Moderno / Colorido</option>
                <option value="minimalista">Minimalista / Simple</option>
                <option value="creativo">Creativo / Diseño</option>
                <option value="ejecutivo">Ejecutivo / Corporativo</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Imagen (PNG, JPG o PDF)</label>
              <div onClick={() => document.getElementById('imgInput').click()}
                style={{ border: '2px dashed var(--gris2)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: form.imagen_url ? 'transparent' : 'var(--gris)' }}>
                {form.imagen_url
                  ? <img src={form.imagen_url} alt="preview" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
                  : <><div style={{ fontSize: 28, marginBottom: 6 }}>📷</div><div style={{ fontSize: 13, color: 'var(--texto2)' }}>Clic para subir imagen</div></>
                }
              </div>
              <input id="imgInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={subirImagen} />
            </div>

            {error && <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>}
            {exito && <div style={{ fontSize: 13, color: 'var(--verde)', marginBottom: 12, fontWeight: 700 }}>✅ ¡Plantilla guardada en la nube!</div>}

            <button onClick={guardar} disabled={guardando}
              style={{ width: '100%', padding: '11px', background: guardando ? 'var(--gris2)' : 'var(--verde)', border: 'none', borderRadius: 9, color: guardando ? 'var(--texto2)' : 'var(--blanco)', fontWeight: 700, fontSize: 14, cursor: guardando ? 'not-allowed' : 'pointer' }}>
              {guardando ? '⏳ Guardando...' : '💾 Guardar en la nube'}
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--azul)', marginBottom: 16 }}>
              📋 Plantillas en la nube ({plantillas.length})
            </h2>
            {cargando ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--texto2)' }}>⏳ Cargando...</div>
            ) : plantillas.length === 0 ? (
              <div style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                <div style={{ fontSize: 14, color: 'var(--texto2)' }}>Aún no hay plantillas</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantillas.map(p => (
                  <div key={p.id} style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 12, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre} style={{ width: 60, height: 70, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      : <div style={{ width: 60, height: 70, background: 'var(--gris)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--texto)', marginBottom: 3 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--texto2)', lineHeight: 1.5, marginBottom: 6 }}>{p.descripcion}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: 'rgba(57,169,0,0.1)', border: '1px solid rgba(57,169,0,0.2)', color: 'var(--verde)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{p.estilo}</span>
                        <span style={{ fontSize: 11, color: 'var(--texto2)' }}>por {p.autor}</span>
                      </div>
                    </div>
                    <button onClick={() => eliminar(p.id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 7, padding: '6px 10px', color: '#ff4444', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}