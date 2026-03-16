import { useState, useEffect } from 'react'

const CLAVE = 'sena2026'

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [plantillas, setPlantillas] = useState(() => {
    const guardadas = localStorage.getItem('plantillas_admin')
    return guardadas ? JSON.parse(guardadas) : []
  })
  const [form, setForm] = useState({
    nombre: '', descripcion: '', estilo: 'formal', imagen: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  const entrar = () => {
    if (password === CLAVE) {
      setAutenticado(true)
      setError('')
    } else {
      setError('❌ Contraseña incorrecta')
    }
  }

  const subirImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, imagen: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const guardar = () => {
    if (!form.nombre || !form.descripcion) {
      setError('⚠️ El nombre y descripción son obligatorios')
      return
    }
    setGuardando(true)
    setTimeout(() => {
      const nueva = { ...form, id: Date.now(), fecha: new Date().toLocaleDateString() }
      const nuevas = [...plantillas, nueva]
      setPlantillas(nuevas)
      localStorage.setItem('plantillas_admin', JSON.stringify(nuevas))
      setForm({ nombre: '', descripcion: '', estilo: 'formal', imagen: '' })
      setGuardando(false)
      setExito(true)
      setError('')
      setTimeout(() => setExito(false), 3000)
    }, 800)
  }

  const eliminar = (id) => {
    const nuevas = plantillas.filter(p => p.id !== id)
    setPlantillas(nuevas)
    localStorage.setItem('plantillas_admin', JSON.stringify(nuevas))
  }

  // ── LOGIN ──────────────────────────────────────
  if (!autenticado) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--gris)',
      }}>
        <div style={{
          background: 'var(--blanco)',
          border: '1px solid var(--gris2)',
          borderRadius: 16, padding: 36,
          width: 360, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)', marginBottom: 4 }}>
            Panel Administrador
          </h2>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 24 }}>
            Solo para el equipo de diseño
          </p>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="Contraseña"
            style={{
              width: '100%', padding: '11px 14px',
              background: 'var(--gris)', border: '1px solid var(--gris2)',
              borderRadius: 9, fontSize: 14, color: 'var(--texto)',
              marginBottom: 12, textAlign: 'center',
              letterSpacing: '0.2em',
            }}
          />

          {error && (
            <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>
          )}

          <button
            onClick={entrar}
            style={{
              width: '100%', padding: '11px',
              background: 'var(--azul)', border: 'none',
              borderRadius: 9, color: 'var(--blanco)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Entrar →
          </button>

          <p style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 16 }}>
            ¿No tienes la contraseña? Pídela a Camilo 😊
          </p>
        </div>
      </div>
    )
  }

  // ── PANEL ADMIN ────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '20px 32px',
        borderBottom: '1px solid var(--gris2)',
        background: 'var(--blanco)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--azul)' }}>
            🎨 Panel de Plantillas
          </h1>
          <p style={{ fontSize: 13, color: 'var(--texto2)', marginTop: 3 }}>
            Agrega y gestiona las plantillas de hoja de vida
          </p>
        </div>
        <button
          onClick={() => setAutenticado(false)}
          style={{
            padding: '8px 16px', background: 'var(--gris)',
            border: '1px solid var(--gris2)', borderRadius: 8,
            color: 'var(--texto2)', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>

          {/* Formulario */}
          <div>
            <div style={{
              background: 'var(--blanco)',
              border: '1px solid var(--gris2)',
              borderRadius: 16, padding: 24,
              borderTop: '3px solid var(--verde)',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--azul)', marginBottom: 20 }}>
                ➕ Agregar plantilla nueva
              </h2>

              {/* Nombre */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Nombre de la plantilla *
                </label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Plantilla Ejecutiva"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}
                />
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Descripción *
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Describe el estilo y para quién es ideal esta plantilla..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {/* Estilo */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Estilo
                </label>
                <select
                  value={form.estilo}
                  onChange={e => setForm(f => ({ ...f, estilo: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--gris)', border: '1px solid var(--gris2)', borderRadius: 8, fontSize: 13, color: 'var(--texto)' }}
                >
                  <option value="formal">Formal / Clásico</option>
                  <option value="moderno">Moderno / Colorido</option>
                  <option value="minimalista">Minimalista / Simple</option>
                  <option value="creativo">Creativo / Diseño</option>
                  <option value="ejecutivo">Ejecutivo / Corporativo</option>
                </select>
              </div>

              {/* Imagen */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                  Imagen de vista previa
                </label>
                <div
                  onClick={() => document.getElementById('imgInput').click()}
                  style={{
                    border: '2px dashed var(--gris2)', borderRadius: 10,
                    padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: form.imagen ? 'transparent' : 'var(--gris)',
                    transition: 'all 0.2s',
                  }}
                >
                  {form.imagen ? (
                    <img src={form.imagen} alt="preview" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div style={{ fontSize: 13, color: 'var(--texto2)' }}>Clic para subir imagen</div>
                      <div style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 3 }}>JPG, PNG recomendado</div>
                    </>
                  )}
                </div>
                <input id="imgInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={subirImagen} />
              </div>

              {error && (
                <div style={{ fontSize: 13, color: '#ff4444', marginBottom: 12 }}>{error}</div>
              )}

              {exito && (
                <div style={{ fontSize: 13, color: 'var(--verde)', marginBottom: 12, fontWeight: 700 }}>
                  ✅ ¡Plantilla guardada exitosamente!
                </div>
              )}

              <button
                onClick={guardar}
                disabled={guardando}
                style={{
                  width: '100%', padding: '11px',
                  background: guardando ? 'var(--gris2)' : 'var(--verde)',
                  border: 'none', borderRadius: 9,
                  color: guardando ? 'var(--texto2)' : 'var(--blanco)',
                  fontWeight: 700, fontSize: 14,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar plantilla'}
              </button>
            </div>
          </div>

          {/* Lista plantillas */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--azul)', marginBottom: 16 }}>
              📋 Plantillas guardadas ({plantillas.length})
            </h2>

            {plantillas.length === 0 ? (
              <div style={{
                background: 'var(--blanco)', border: '1px solid var(--gris2)',
                borderRadius: 16, padding: '40px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                <div style={{ fontSize: 14, color: 'var(--texto2)' }}>
                  Aún no hay plantillas guardadas
                </div>
                <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 4 }}>
                  Agrega la primera usando el formulario
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plantillas.map(p => (
                  <div key={p.id} style={{
                    background: 'var(--blanco)', border: '1px solid var(--gris2)',
                    borderRadius: 12, padding: 16,
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} style={{ width: 60, height: 70, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 60, height: 70, background: 'var(--gris)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--texto)', marginBottom: 3 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--texto2)', lineHeight: 1.5, marginBottom: 6 }}>{p.descripcion}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ background: 'rgba(57,169,0,0.1)', border: '1px solid rgba(57,169,0,0.2)', color: 'var(--verde)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>
                          {p.estilo}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--texto2)' }}>{p.fecha}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminar(p.id)}
                      style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 7, padding: '6px 10px', color: '#ff4444', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                    >
                      🗑
                    </button>
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