import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/inicio',      icon: '🏠', label: 'Inicio' },
  { to: '/crear-cv',    icon: '📝', label: 'Crear CV' },
  { to: '/subir-cv',    icon: '📤', label: 'Subir CV (ATS)' },
  { to: '/entrevista',  icon: '🎯', label: 'Simular Entrevista' },
  { to: '/chat',        icon: '💬', label: 'Chat Laboral' },
  { to: '/tips',        icon: '💡', label: 'Tips y Consejos' },
  { to: '/plantillas',  icon: '🎨', label: 'Plantillas' },
  { to: '/admin',       icon: '🔐', label: 'Admin Plantillas' },
]

const HUELLAS = ['🐾','🐾','🐾','🐾','🐾','🐾']

export default function Sidebar() {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--azul)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Sección del perrito Ruti */}
      <div style={{
        padding: '28px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '3px solid var(--verde)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 44,
          margin: '0 auto 10px',
          boxShadow: '0 0 20px rgba(57,169,0,0.3)',
        }}>
          🐶
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--blanco)', letterSpacing: 0.5 }}>
          Ruti
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
          Tu guía laboral 🌟
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {HUELLAS.map((h, i) => (
            <span key={i} style={{
              fontSize: 10,
              opacity: 0.3 + (i * 0.1),
              transform: `rotate(${i % 2 === 0 ? '-15deg' : '15deg'})`,
              display: 'inline-block',
            }}>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '8px 12px 4px',
        }}>
          Módulos
        </div>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/inicio'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 10, padding: '10px 12px', borderRadius: 9,
              color: isActive ? 'var(--blanco)' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'var(--verde)' : 'transparent',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s', marginBottom: 2,
            })}
          >
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.6,
      }}>
        🟢 IA Activa — Gemini<br />
        Powered by SENA 2026
      </div>
    </aside>
  )
}