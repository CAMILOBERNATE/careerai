import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const COLORES_PREDEFINIDOS = [
  { nombre: 'Azul Corporativo', primario: '#003DA5', secundario: '#E8F0FF', texto: '#FFFFFF' },
  { nombre: 'Verde Sena', primario: '#39A900', secundario: '#E8F8E8', texto: '#FFFFFF' },
  { nombre: 'Gris Ejecutivo', primario: '#2C3E50', secundario: '#ECF0F1', texto: '#FFFFFF' },
  { nombre: 'Rojo Creativo', primario: '#C0392B', secundario: '#FDEDEC', texto: '#FFFFFF' },
  { nombre: 'Morado Moderno', primario: '#6C3483', secundario: '#F5EEF8', texto: '#FFFFFF' },
  { nombre: 'Café Elegante', primario: '#784212', secundario: '#FDF2E9', texto: '#FFFFFF' },
  { nombre: 'Azul Marino', primario: '#154360', secundario: '#D6EAF8', texto: '#FFFFFF' },
  { nombre: 'Verde Oscuro', primario: '#1E8449', secundario: '#E9F7EF', texto: '#FFFFFF' },
]

// Preview SVG de la plantilla según configuración
function PreviewPlantilla({ config, pequeño = false }) {
  const s = pequeño ? 0.38 : 1
  const w = 210 * s
  const h = 297 * s
  const { colorPrimario, colorSecundario, colorTexto, columnas, tienesFoto, estilo } = config

  if (columnas === '2') {
    // Layout 2 columnas
    const anchoLateral = 70 * s
    return (
      <svg width={w} height={h} viewBox={`0 0 ${210} ${297}`} style={{ borderRadius: pequeño ? 6 : 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'block' }}>
        {/* Columna izquierda */}
        <rect x="0" y="0" width="70" height="297" fill={colorPrimario} />
        {/* Columna derecha */}
        <rect x="70" y="0" width="140" height="297" fill="#FFFFFF" />

        {/* Foto */}
        {tienesFoto === 'si' && (
          <g>
            <circle cx="35" cy="38" r="22" fill={colorSecundario} opacity="0.3" />
            <circle cx="35" cy="38" r="18" fill={colorSecundario} opacity="0.5" />
            <text x="35" y="43" textAnchor="middle" fontSize="16" fill={colorTexto} opacity="0.8">👤</text>
          </g>
        )}

        {/* Nombre en columna izquierda */}
        <rect x="8" y={tienesFoto === 'si' ? 68 : 20} width="54" height="5" rx="2" fill={colorTexto} opacity="0.9" />
        <rect x="8" y={tienesFoto === 'si' ? 76 : 28} width="40" height="3" rx="1.5" fill={colorTexto} opacity="0.6" />

        {/* Sección contacto lateral */}
        <rect x="8" y={tienesFoto === 'si' ? 90 : 45} width="30" height="3" rx="1.5" fill={colorTexto} opacity="0.8" />
        <rect x="8" y={tienesFoto === 'si' ? 96 : 51} width="54" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 101 : 56} width="48" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 106 : 61} width="50" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 111 : 66} width="44" height="2" rx="1" fill={colorTexto} opacity="0.5" />

        {/* Habilidades lateral */}
        <rect x="8" y={tienesFoto === 'si' ? 125 : 80} width="35" height="3" rx="1.5" fill={colorTexto} opacity="0.8" />
        {[0,1,2,3].map(i => (
          <rect key={i} x="8" y={(tienesFoto === 'si' ? 132 : 87) + i * 8} width="54" height="5" rx="2.5" fill={colorTexto} opacity="0.25" />
        ))}

        {/* Contenido columna derecha */}
        {/* Perfil */}
        <rect x="80" y="18" width="50" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        <rect x="80" y="25" width="120" height="2" rx="1" fill="#888" opacity="0.5" />
        <rect x="80" y="30" width="110" height="2" rx="1" fill="#888" opacity="0.5" />
        <rect x="80" y="35" width="115" height="2" rx="1" fill="#888" opacity="0.5" />

        {/* Línea divisoria */}
        <rect x="80" y="44" width="120" height="0.5" fill={colorPrimario} opacity="0.3" />

        {/* Experiencia */}
        <rect x="80" y="50" width="60" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        {[0,1].map(e => (
          <g key={e}>
            <rect x="80" y={62 + e * 35} width="90" height="3" rx="1.5" fill="#333" opacity="0.7" />
            <rect x="80" y={68 + e * 35} width="70" height="2" rx="1" fill="#888" opacity="0.5" />
            <rect x="80" y={73 + e * 35} width="120" height="2" rx="1" fill="#aaa" opacity="0.4" />
            <rect x="80" y={78 + e * 35} width="110" height="2" rx="1" fill="#aaa" opacity="0.4" />
          </g>
        ))}

        {/* Educación */}
        <rect x="80" y="140" width="50" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        <rect x="80" y="150" width="90" height="3" rx="1.5" fill="#333" opacity="0.7" />
        <rect x="80" y="156" width="70" height="2" rx="1" fill="#888" opacity="0.5" />
      </svg>
    )
  }

  // Layout 1 columna
  return (
    <svg width={w} height={h} viewBox="0 0 210 297" style={{ borderRadius: pequeño ? 6 : 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'block' }}>
      <rect width="210" height="297" fill="#FFFFFF" />

      {/* Header */}
      <rect x="0" y="0" width="210" height={tienesFoto === 'si' ? 65 : 55} fill={colorPrimario} />

      {/* Foto */}
      {tienesFoto === 'si' && (
        <g>
          <circle cx="30" cy="32" r="20" fill={colorSecundario} opacity="0.4" />
          <circle cx="30" cy="32" r="16" fill={colorSecundario} opacity="0.6" />
          <text x="30" y="37" textAnchor="middle" fontSize="14" fill={colorTexto} opacity="0.9">👤</text>
          <rect x="55" y="16" width="100" height="6" rx="3" fill={colorTexto} opacity="0.95" />
          <rect x="55" y="25" width="75" height="4" rx="2" fill={colorTexto} opacity="0.7" />
          <rect x="55" y="33" width="120" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="55" y="38" width="100" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="55" y="43" width="90" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="55" y="48" width="110" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
        </g>
      )}

      {/* Sin foto - solo nombre y datos */}
      {tienesFoto !== 'si' && (
        <g>
          <rect x="15" y="14" width="110" height="7" rx="3.5" fill={colorTexto} opacity="0.95" />
          <rect x="15" y="24" width="80" height="4.5" rx="2.25" fill={colorTexto} opacity="0.7" />
          <rect x="15" y="32" width="170" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="15" y="37" width="150" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="15" y="42" width="160" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
          <rect x="15" y="47" width="140" height="2.5" rx="1.25" fill={colorTexto} opacity="0.55" />
        </g>
      )}

      {/* Línea acento */}
      <rect x="0" y={tienesFoto === 'si' ? 65 : 55} width="210" height="3" fill={colorSecundario === '#FFFFFF' ? colorPrimario : colorSecundario} opacity="0.8" />

      {/* Perfil Ocupacional */}
      <rect x="15" y={tienesFoto === 'si' ? 76 : 66} width="55" height="4.5" rx="2.25" fill={colorPrimario} />
      <rect x="15" y={tienesFoto === 'si' ? 84 : 74} width="180" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 89 : 79} width="165" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 94 : 84} width="170" height="2.5" rx="1.25" fill="#888" opacity="0.5" />

      {/* Experiencia */}
      <rect x="15" y={tienesFoto === 'si' ? 106 : 96} width="65" height="4.5" rx="2.25" fill={colorPrimario} />
      {[0, 1].map(e => (
        <g key={e}>
          <rect x="15" y={(tienesFoto === 'si' ? 117 : 107) + e * 32} width="100" height="3.5" rx="1.75" fill="#333" opacity="0.75" />
          <rect x="15" y={(tienesFoto === 'si' ? 123 : 113) + e * 32} width="75" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
          <rect x="15" y={(tienesFoto === 'si' ? 128 : 118) + e * 32} width="180" height="2" rx="1" fill="#aaa" opacity="0.4" />
          <rect x="15" y={(tienesFoto === 'si' ? 132 : 122) + e * 32} width="160" height="2" rx="1" fill="#aaa" opacity="0.4" />
        </g>
      ))}

      {/* Educación */}
      <rect x="15" y={tienesFoto === 'si' ? 186 : 176} width="50" height="4.5" rx="2.25" fill={colorPrimario} />
      <rect x="15" y={tienesFoto === 'si' ? 195 : 185} width="110" height="3.5" rx="1.75" fill="#333" opacity="0.75" />
      <rect x="15" y={tienesFoto === 'si' ? 201 : 191} width="85" height="2.5" rx="1.25" fill="#888" opacity="0.5" />

      {/* Habilidades */}
      <rect x="15" y={tienesFoto === 'si' ? 213 : 203} width="50" height="4.5" rx="2.25" fill={colorPrimario} />
      <g>
        {['Excel', 'Word', 'Trabajo equipo', 'Liderazgo'].map((_, i) => (
          <rect key={i} x={15 + (i % 3) * 65} y={(tienesFoto === 'si' ? 222 : 212) + Math.floor(i / 3) * 12} width="58" height="8" rx="4" fill={colorSecundario} stroke={colorPrimario} strokeWidth="0.5" opacity="0.8" />
        ))}
      </g>
    </svg>
  )
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [plantillas, setPlantillas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [paso, setPaso] = useState(1) // 1: info, 2: diseño, 3: preview

  const [form, setForm] = useState({
    nombre: '',
    autor: '',
    descripcion: '',
    estilo: 'formal',
    colorPrimario: '#003DA5',
    colorSecundario: '#E8F0FF',
    colorTexto: '#FFFFFF',
    columnas: '1',
    tienesFoto: 'no',
  })

  useEffect(() => {
    if (autenticado) cargarPlantillas()
  }, [autenticado])

  const cargarPlantillas = async () => {
    setCargando(true)
    const { data } = await supabase.from('plantillas').select('*').order('id', { ascending: false })
    setPlantillas(data || [])
    setCargando(false)
  }

  const guardar = async () => {
    if (!form.nombre || !form.descripcion || !form.autor) {
      setError('⚠️ Nombre, autor y descripción son obligatorios')
      return
    }
    setGuardando(true)
    const config = {
      colorPrimario: form.colorPrimario,
      colorSecundario: form.colorSecundario,
      colorTexto: form.colorTexto,
      columnas: form.columnas,
      tienesFoto: form.tienesFoto,
    }
    const { error: err } = await supabase.from('plantillas').insert([{
      nombre: form.nombre,
      descripcion: form.descripcion,
      estilo: form.estilo,
      autor: form.autor,
      imagen_url: '',
      config: config,
    }])
    if (err) {
      setError('❌ Error al guardar. Verifica que la columna "config" existe en Supabase (tipo jsonb).')
      setGuardando(false)
      return
    }
    setForm({ nombre: '', autor: '', descripcion: '', estilo: 'formal', colorPrimario: '#003DA5', colorSecundario: '#E8F0FF', colorTexto: '#FFFFFF', columnas: '1', tienesFoto: 'no' })
    setGuardando(false)
    setExito(true)
    setError('')
    setPaso(1)
    setTimeout(() => setExito(false), 3000)
    cargarPlantillas()
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return
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

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--gris)', border: '1px solid var(--gris2)',
    borderRadius: 8, fontSize: 13, color: 'var(--texto)',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--texto2)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    display: 'block', marginBottom: 5,
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
            style={{ ...inputStyle, textAlign: 'center', marginBottom: 12 }}
          />
          {error && <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>}
          <button onClick={entrar} style={{ width: '100%', padding: 11, background: 'var(--azul)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Entrar →
          </button>
          <p style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 16 }}>¿No tienes acceso? Contacta a Camilo 😊</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>🎨 Panel de Plantillas</h1>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Crea plantillas con diseño visual — los usuarios las verán y podrán usarlas</p>
        </div>
        <button onClick={() => setAutenticado(false)} style={{ padding: '8px 16px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, color: 'var(--texto2)', fontSize: 13, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 960 }}>

          {/* FORMULARIO CREACIÓN */}
          <div style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 16, padding: 24, borderTop: '3px solid var(--verde)' }}>

            {/* Pasos */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
              {[['1', 'Información'], ['2', 'Diseño'], ['3', 'Preview']].map(([n, label], i) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                  <div
                    onClick={() => setPaso(Number(n))}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: paso >= Number(n) ? 'var(--azul)' : 'var(--gris)',
                      border: `2px solid ${paso >= Number(n) ? 'var(--azul)' : 'var(--gris2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: paso >= Number(n) ? 'white' : 'var(--texto2)',
                      transition: 'all 0.2s',
                    }}>{n}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: paso >= Number(n) ? 'var(--azul)' : 'var(--texto2)' }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: paso > Number(n) ? 'var(--azul)' : 'var(--gris2)', margin: '0 8px', transition: 'all 0.2s' }} />}
                </div>
              ))}
            </div>

            {/* PASO 1 — Información */}
            {paso === 1 && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 18 }}>📝 Información de la plantilla</h2>
                {[
                  ['nombre', 'Nombre de la plantilla *', 'Ej: Plantilla Ejecutiva Azul'],
                  ['autor', 'Tu nombre (autor) *', 'Ej: Alixon García'],
                  ['descripcion', 'Descripción *', 'Describe el estilo y para quién es ideal...'],
                ].map(([campo, label, placeholder]) => (
                  <div key={campo} style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{label}</label>
                    {campo === 'descripcion'
                      ? <textarea value={form[campo]} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))} placeholder={placeholder} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                      : <input value={form[campo]} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                    }
                  </div>
                ))}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Estilo / Categoría</label>
                  <select value={form.estilo} onChange={e => setForm(f => ({ ...f, estilo: e.target.value }))} style={inputStyle}>
                    <option value="formal">Formal / Clásico</option>
                    <option value="moderno">Moderno / Colorido</option>
                    <option value="minimalista">Minimalista / Simple</option>
                    <option value="creativo">Creativo / Diseño</option>
                    <option value="ejecutivo">Ejecutivo / Corporativo</option>
                  </select>
                </div>
                <button onClick={() => setPaso(2)} style={{ width: '100%', padding: 11, background: 'var(--azul)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Siguiente: Diseño →
                </button>
              </div>
            )}

            {/* PASO 2 — Diseño */}
            {paso === 2 && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 18 }}>🎨 Diseño visual</h2>

                {/* Colores predefinidos */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Paleta de colores</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {COLORES_PREDEFINIDOS.map(c => (
                      <div
                        key={c.nombre}
                        onClick={() => setForm(f => ({ ...f, colorPrimario: c.primario, colorSecundario: c.secundario, colorTexto: c.texto }))}
                        title={c.nombre}
                        style={{
                          height: 36, borderRadius: 8, cursor: 'pointer',
                          background: c.primario,
                          border: form.colorPrimario === c.primario ? `3px solid ${c.primario}` : '2px solid transparent',
                          boxShadow: form.colorPrimario === c.primario ? `0 0 0 2px white, 0 0 0 4px ${c.primario}` : 'none',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {form.colorPrimario === c.primario && <span style={{ fontSize: 14, color: 'white' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 6 }}>O personaliza el color:</p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                    <input type="color" value={form.colorPrimario} onChange={e => setForm(f => ({ ...f, colorPrimario: e.target.value }))} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                    <span style={{ fontSize: 12, color: 'var(--texto2)' }}>Color principal</span>
                    <input type="color" value={form.colorSecundario} onChange={e => setForm(f => ({ ...f, colorSecundario: e.target.value }))} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                    <span style={{ fontSize: 12, color: 'var(--texto2)' }}>Color acento</span>
                  </div>
                </div>

                {/* Columnas */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Estructura del layout</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['1', '1 Columna', '▬\n▬\n▬'], ['2', '2 Columnas', '▌▬\n▌▬\n▌▬']].map(([val, label, icon]) => (
                      <div
                        key={val}
                        onClick={() => setForm(f => ({ ...f, columnas: val }))}
                        style={{
                          border: `2px solid ${form.columnas === val ? 'var(--azul)' : 'var(--gris2)'}`,
                          borderRadius: 10, padding: '14px 10px', textAlign: 'center',
                          cursor: 'pointer', background: form.columnas === val ? 'rgba(0,61,165,0.05)' : 'var(--gris)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{val === '1' ? '📄' : '📋'}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: form.columnas === val ? 'var(--azul)' : 'var(--texto2)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foto */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>¿Incluye campo de foto?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['si', '📷 Con foto'], ['no', '🚫 Sin foto']].map(([val, label]) => (
                      <div
                        key={val}
                        onClick={() => setForm(f => ({ ...f, tienesFoto: val }))}
                        style={{
                          border: `2px solid ${form.tienesFoto === val ? 'var(--azul)' : 'var(--gris2)'}`,
                          borderRadius: 10, padding: '12px 10px', textAlign: 'center',
                          cursor: 'pointer', background: form.tienesFoto === val ? 'rgba(0,61,165,0.05)' : 'var(--gris)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: form.tienesFoto === val ? 'var(--azul)' : 'var(--texto2)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPaso(1)} style={{ flex: 1, padding: 11, background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 9, color: 'var(--texto2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    ← Atrás
                  </button>
                  <button onClick={() => setPaso(3)} style={{ flex: 2, padding: 11, background: 'var(--azul)', border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Ver preview →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3 — Preview y guardar */}
            {paso === 3 && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--azul)', marginBottom: 6 }}>👁 Preview de la plantilla</h2>
                <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 16 }}>Así se verá el diseño que los usuarios pueden escoger</p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <PreviewPlantilla config={form} pequeño={true} />
                </div>

                {/* Resumen */}
                <div style={{ background: 'var(--gris)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--texto2)' }}>Nombre:</span>
                    <span style={{ fontWeight: 700 }}>{form.nombre || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--texto2)' }}>Autor:</span>
                    <span style={{ fontWeight: 700 }}>{form.autor || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--texto2)' }}>Estilo:</span>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{form.estilo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--texto2)' }}>Layout:</span>
                    <span style={{ fontWeight: 700 }}>{form.columnas === '1' ? '1 columna' : '2 columnas'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--texto2)' }}>Foto:</span>
                    <span style={{ fontWeight: 700 }}>{form.tienesFoto === 'si' ? 'Sí incluye' : 'No incluye'}</span>
                  </div>
                </div>

                {error && <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>}
                {exito && <div style={{ fontSize: 13, color: 'var(--verde)', marginBottom: 12, fontWeight: 700 }}>✅ ¡Plantilla guardada!</div>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPaso(2)} style={{ flex: 1, padding: 11, background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 9, color: 'var(--texto2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    ← Editar
                  </button>
                  <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: 11, background: guardando ? 'var(--gris2)' : 'var(--verde)', border: 'none', borderRadius: 9, color: guardando ? 'var(--texto2)' : 'white', fontWeight: 700, fontSize: 14, cursor: guardando ? 'not-allowed' : 'pointer' }}>
                    {guardando ? '⏳ Guardando...' : '💾 Guardar plantilla'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE PLANTILLAS */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--azul)', marginBottom: 16 }}>
              📋 Plantillas guardadas ({plantillas.length})
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
                {plantillas.map(p => {
                  const cfg = p.config || { colorPrimario: '#003DA5', colorSecundario: '#E8F0FF', colorTexto: '#FFFFFF', columnas: '1', tienesFoto: 'no' }
                  return (
                    <div key={p.id} style={{ background: 'var(--blanco)', border: '1px solid var(--gris2)', borderRadius: 12, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0 }}>
                        <PreviewPlantilla config={cfg} pequeño={true} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--texto)', marginBottom: 3 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--texto2)', lineHeight: 1.5, marginBottom: 6 }}>{p.descripcion}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(57,169,0,0.1)', border: '1px solid rgba(57,169,0,0.2)', color: 'var(--verde)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{p.estilo}</span>
                          <span style={{ background: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.15)', color: 'var(--azul)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{cfg.columnas === '2' ? '2 col' : '1 col'}</span>
                          {cfg.tienesFoto === 'si' && <span style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>📷 foto</span>}
                          <span style={{ fontSize: 11, color: 'var(--texto2)' }}>por {p.autor}</span>
                        </div>
                      </div>
                      <button onClick={() => eliminar(p.id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 7, padding: '6px 10px', color: '#ff4444', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}