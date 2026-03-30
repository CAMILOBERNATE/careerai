import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Plantillas() {
  const [plantillas, setPlantillas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const navigate = useNavigate()

  useEffect(() => {
    cargar()
  }, [])

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

      {/* Header */}
      <div style={{
        padding: '20px 32px',
        borderBottom: '1px solid var(--gris2)',
        background: 'var(--blanco)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>
          🎨 Plantillas de Hoja de Vida
        </h1>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>
          Escoge el diseño que más te guste para tu CV
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        padding: '12px 32px',
        borderBottom: '1px solid var(--gris2)',
        background: 'var(--blanco)',
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {FILTROS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            style={{
              padding: '6px 16px',
              background: filtro === val ? 'var(--azul)' : 'var(--gris)',
              border: `1px solid ${filtro === val ? 'var(--azul)' : 'var(--gris2)'}`,
              borderRadius: 99,
              color: filtro === val ? 'white' : 'var(--texto2)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
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
            <button
              onClick={() => navigate('/crear-cv')}
              style={{
                padding: '11px 24px',
                background: 'var(--verde)', border: 'none',
                borderRadius: 10, color: 'white',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              📝 Crear CV sin plantilla
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtradas.map(p => (
              <PlantillaCard key={p.id} plantilla={p} onSeleccionar={() => navigate('/crear-cv', { state: { plantilla: p } })} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlantillaCard({ plantilla: p, onSeleccionar }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--blanco)',
        border: `1px solid ${hov ? 'var(--azul)' : 'var(--gris2)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all 0.2s',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
      }}
    >
      {/* Preview imagen */}
      <div style={{
        height: 180,
        background: 'var(--gris)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden',
        position: 'relative',
      }}>
        {p.imagen_url ? (
          <img src={p.imagen_url} alt={p.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: 48, opacity: 0.3 }}>📄</div>
        )}

        {/* Overlay al hacer hover */}
        {hov && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,61,165,0.85)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeUp 0.2s ease',
          }}>
            <button
              onClick={onSeleccionar}
              style={{
                padding: '10px 22px',
                background: 'var(--verde)', border: 'none',
                borderRadius: 9, color: 'white',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              ✅ Usar esta plantilla
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--texto)', marginBottom: 4 }}>
          {p.nombre}
        </div>
        <div style={{ fontSize: 12, color: 'var(--texto2)', lineHeight: 1.5, marginBottom: 8 }}>
          {p.descripcion}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            background: 'rgba(0,61,165,0.08)',
            border: '1px solid rgba(0,61,165,0.15)',
            color: 'var(--azul)', fontSize: 10,
            fontWeight: 700, padding: '2px 8px',
            borderRadius: 99, textTransform: 'uppercase',
          }}>
            {p.estilo}
          </span>
          <span style={{ fontSize: 11, color: 'var(--texto2)' }}>
            por {p.autor}
          </span>
        </div>
      </div>
    </div>
  )
}