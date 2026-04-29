import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

// Mismo componente preview que en Admin
function PreviewPlantilla({ config, pequeño = false }) {
  const s = pequeño ? 0.38 : 1
  const w = 210 * s
  const h = 297 * s
  const { colorPrimario, colorSecundario, colorTexto, columnas, tienesFoto } = config

  if (columnas === '2') {
    return (
      <svg width={w} height={h} viewBox="0 0 210 297" style={{ borderRadius: pequeño ? 6 : 10, display: 'block' }}>
        <rect x="0" y="0" width="70" height="297" fill={colorPrimario} />
        <rect x="70" y="0" width="140" height="297" fill="#FFFFFF" />
        {tienesFoto === 'si' && (
          <g>
            <circle cx="35" cy="38" r="22" fill={colorSecundario} opacity="0.3" />
            <circle cx="35" cy="38" r="18" fill={colorSecundario} opacity="0.5" />
            <text x="35" y="43" textAnchor="middle" fontSize="16" fill={colorTexto} opacity="0.8">👤</text>
          </g>
        )}
        <rect x="8" y={tienesFoto === 'si' ? 68 : 20} width="54" height="5" rx="2" fill={colorTexto} opacity="0.9" />
        <rect x="8" y={tienesFoto === 'si' ? 76 : 28} width="40" height="3" rx="1.5" fill={colorTexto} opacity="0.6" />
        <rect x="8" y={tienesFoto === 'si' ? 90 : 45} width="30" height="3" rx="1.5" fill={colorTexto} opacity="0.8" />
        <rect x="8" y={tienesFoto === 'si' ? 96 : 51} width="54" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 101 : 56} width="48" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 106 : 61} width="50" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 111 : 66} width="44" height="2" rx="1" fill={colorTexto} opacity="0.5" />
        <rect x="8" y={tienesFoto === 'si' ? 125 : 80} width="35" height="3" rx="1.5" fill={colorTexto} opacity="0.8" />
        {[0,1,2,3].map(i => (
          <rect key={i} x="8" y={(tienesFoto === 'si' ? 132 : 87) + i * 8} width="54" height="5" rx="2.5" fill={colorTexto} opacity="0.25" />
        ))}
        <rect x="80" y="18" width="50" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        <rect x="80" y="25" width="120" height="2" rx="1" fill="#888" opacity="0.5" />
        <rect x="80" y="30" width="110" height="2" rx="1" fill="#888" opacity="0.5" />
        <rect x="80" y="35" width="115" height="2" rx="1" fill="#888" opacity="0.5" />
        <rect x="80" y="44" width="120" height="0.5" fill={colorPrimario} opacity="0.3" />
        <rect x="80" y="50" width="60" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        {[0,1].map(e => (
          <g key={e}>
            <rect x="80" y={62 + e * 35} width="90" height="3" rx="1.5" fill="#333" opacity="0.7" />
            <rect x="80" y={68 + e * 35} width="70" height="2" rx="1" fill="#888" opacity="0.5" />
            <rect x="80" y={73 + e * 35} width="120" height="2" rx="1" fill="#aaa" opacity="0.4" />
            <rect x="80" y={78 + e * 35} width="110" height="2" rx="1" fill="#aaa" opacity="0.4" />
          </g>
        ))}
        <rect x="80" y="140" width="50" height="4" rx="2" fill={colorPrimario} opacity="0.9" />
        <rect x="80" y="150" width="90" height="3" rx="1.5" fill="#333" opacity="0.7" />
        <rect x="80" y="156" width="70" height="2" rx="1" fill="#888" opacity="0.5" />
      </svg>
    )
  }

  return (
    <svg width={w} height={h} viewBox="0 0 210 297" style={{ borderRadius: pequeño ? 6 : 10, display: 'block' }}>
      <rect width="210" height="297" fill="#FFFFFF" />
      <rect x="0" y="0" width="210" height={tienesFoto === 'si' ? 65 : 55} fill={colorPrimario} />
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
      <rect x="0" y={tienesFoto === 'si' ? 65 : 55} width="210" height="3" fill={colorSecundario === '#FFFFFF' ? colorPrimario : colorSecundario} opacity="0.8" />
      <rect x="15" y={tienesFoto === 'si' ? 76 : 66} width="55" height="4.5" rx="2.25" fill={colorPrimario} />
      <rect x="15" y={tienesFoto === 'si' ? 84 : 74} width="180" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 89 : 79} width="165" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 94 : 84} width="170" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 106 : 96} width="65" height="4.5" rx="2.25" fill={colorPrimario} />
      {[0, 1].map(e => (
        <g key={e}>
          <rect x="15" y={(tienesFoto === 'si' ? 117 : 107) + e * 32} width="100" height="3.5" rx="1.75" fill="#333" opacity="0.75" />
          <rect x="15" y={(tienesFoto === 'si' ? 123 : 113) + e * 32} width="75" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
          <rect x="15" y={(tienesFoto === 'si' ? 128 : 118) + e * 32} width="180" height="2" rx="1" fill="#aaa" opacity="0.4" />
          <rect x="15" y={(tienesFoto === 'si' ? 132 : 122) + e * 32} width="160" height="2" rx="1" fill="#aaa" opacity="0.4" />
        </g>
      ))}
      <rect x="15" y={tienesFoto === 'si' ? 186 : 176} width="50" height="4.5" rx="2.25" fill={colorPrimario} />
      <rect x="15" y={tienesFoto === 'si' ? 195 : 185} width="110" height="3.5" rx="1.75" fill="#333" opacity="0.75" />
      <rect x="15" y={tienesFoto === 'si' ? 201 : 191} width="85" height="2.5" rx="1.25" fill="#888" opacity="0.5" />
      <rect x="15" y={tienesFoto === 'si' ? 213 : 203} width="50" height="4.5" rx="2.25" fill={colorPrimario} />
      {[0,1,2,3].map((_, i) => (
        <rect key={i} x={15 + (i % 3) * 65} y={(tienesFoto === 'si' ? 222 : 212) + Math.floor(i / 3) * 12} width="58" height="8" rx="4" fill={colorSecundario} stroke={colorPrimario} strokeWidth="0.5" opacity="0.8" />
      ))}
    </svg>
  )
}

export default function Plantillas() {
  const [plantillas, setPlantillas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase.from('plantillas').select('*')
    setPlantillas(data || [])
    setCargando(false)
  }

  const filtradas = filtro === 'todas' ? plantillas : plantillas.filter(p => p.estilo === filtro)

  const FILTROS = [
    ['todas', 'Todas'],
    ['formal', 'Formal'],
    ['moderno', 'Moderno'],
    ['minimalista', 'Minimalista'],
    ['creativo', 'Creativo'],
    ['ejecutivo', 'Ejecutivo'],
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>🎨 Plantillas de Hoja de Vida</h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>Escoge el diseño que más te guste y llena tu información</p>
      </div>

      <div style={{ padding: '12px 32px', borderBottom: '1px solid var(--gris2)', background: 'var(--blanco)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTROS.map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)} style={{
            padding: '6px 16px',
            background: filtro === val ? 'var(--azul)' : 'var(--gris)',
            border: `1px solid ${filtro === val ? 'var(--azul)' : 'var(--gris2)'}`,
            borderRadius: 99, color: filtro === val ? 'white' : 'var(--texto2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--texto2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>Cargando plantillas...</div>
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎨</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--texto)', marginBottom: 8 }}>
              {filtro === 'todas' ? 'Aún no hay plantillas disponibles' : `No hay plantillas de estilo "${filtro}"`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 20 }}>
              El equipo de diseño está trabajando en las plantillas. ¡Vuelve pronto!
            </div>
            <button onClick={() => navigate('/crear-cv')} style={{ padding: '11px 24px', background: 'var(--verde)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              📝 Crear CV sin plantilla
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filtradas.map(p => {
              const cfg = p.config || { colorPrimario: '#003DA5', colorSecundario: '#E8F0FF', colorTexto: '#FFFFFF', columnas: '1', tienesFoto: 'no' }
              return <PlantillaCard key={p.id} plantilla={p} config={cfg} onSeleccionar={() => navigate('/crear-cv', { state: { plantilla: p } })} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PlantillaCard({ plantilla: p, config, onSeleccionar }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--blanco)',
        border: `2px solid ${hov ? 'var(--azul)' : 'var(--gris2)'}`,
        borderRadius: 14, overflow: 'hidden',
        transition: 'all 0.2s',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ background: 'var(--gris)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 14px 10px', position: 'relative' }}>
        <PreviewPlantilla config={config} pequeño={true} />
        {hov && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,61,165,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <button onClick={onSeleccionar} style={{
              padding: '10px 22px', background: 'var(--verde)',
              border: 'none', borderRadius: 9, color: 'white',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              ✅ Usar esta plantilla
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--texto)', marginBottom: 3 }}>{p.nombre}</div>
        <div style={{ fontSize: 11, color: 'var(--texto2)', lineHeight: 1.5, marginBottom: 8 }}>{p.descripcion}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ background: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.15)', color: 'var(--azul)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase' }}>{p.estilo}</span>
            <span style={{ background: 'rgba(0,61,165,0.05)', border: '1px solid rgba(0,61,165,0.1)', color: 'var(--azul)', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99 }}>{config.columnas === '2' ? '2 col' : '1 col'}</span>
            {config.tienesFoto === 'si' && <span style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>📷</span>}
          </div>
          <span style={{ fontSize: 10, color: 'var(--texto2)' }}>por {p.autor}</span>
        </div>
      </div>
    </div>
  )
}