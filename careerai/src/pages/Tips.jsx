const TIPS = [
  {
    icon: '⚡',
    title: 'Antes de la entrevista',
    color: 'var(--verde)',
    items: [
      'Investiga la empresa: misión, valores y productos clave',
      'Prepara 3-5 historias usando el método STAR',
      'Practica en voz alta frente al espejo o grábate',
      'Prepara preguntas inteligentes para el entrevistador',
      'Verifica el lugar o enlace con 24h de anticipación',
    ],
  },
  {
    icon: '🎯',
    title: 'Método STAR',
    color: 'var(--azul)',
    items: [
      'S — Situación: contexto breve y específico',
      'T — Tarea: cuál era tu responsabilidad exacta',
      'A — Acción: exactamente qué hiciste TÚ',
      'R — Resultado: impacto medible con números',
      'Prepara 5 historias STAR antes de cualquier entrevista',
    ],
  },
  {
    icon: '💬',
    title: 'Durante la entrevista',
    color: 'var(--naranja)',
    items: [
      'Llega 10 min antes o entra al Zoom 5 min antes',
      'Cuida tu lenguaje corporal y contacto visual',
      'Cuantifica logros: aumenté ventas un 30%',
      'Si no entiendes una pregunta, pide que la repitan',
      'Al final pregunta siempre por los próximos pasos',
    ],
  },
  {
    icon: '💰',
    title: 'Negociación salarial',
    color: 'var(--verde)',
    items: [
      'Investiga el rango del mercado antes de negociar',
      'Nunca des primero el número, espera su oferta',
      'Pide siempre un poco más del mínimo que aceptarías',
      'Negocia también vacaciones y trabajo remoto',
      'Si rechazan, pide revisión formal a los 3-6 meses',
    ],
  },
  {
    icon: '📄',
    title: 'Hoja de vida perfecta',
    color: 'var(--azul)',
    items: [
      'Máximo 1-2 páginas sin importar la experiencia',
      'Empieza con perfil profesional de 3-4 líneas',
      'Cuantifica todo: gestioné equipo de 8 personas',
      'Adapta palabras clave de cada oferta laboral',
      'Usa verbos de acción: lideré, implementé, optimicé',
    ],
  },
  {
    icon: '🔗',
    title: 'LinkedIn efectivo',
    color: 'var(--naranja)',
    items: [
      'Foto profesional aumenta visibilidad 21 veces más',
      'Titular que diga QUÉ haces y PARA QUIÉN',
      'Conecta con reclutadores activos de tu sector',
      'Publica contenido de valor 1-2 veces por semana',
      'El 70% de empleos se consiguen por referidos',
    ],
  },
]

export default function Tips() {
  return (
    <div style={{ padding: '40px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--azul)', marginBottom: 6 }}>
          💡 Tips y Consejos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--texto2)' }}>
          Guías prácticas para cada etapa de tu proceso laboral
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {TIPS.map((t, i) => (
          <div key={i} style={{
            background: 'var(--blanco)',
            border: '1px solid var(--gris2)',
            borderRadius: 16,
            padding: 22,
            borderTop: `3px solid ${t.color}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: t.color + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                {t.icon}
              </div>
              <h3 style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--texto)',
              }}>
                {t.title}
              </h3>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {t.items.map((item, j) => (
                <li key={j} style={{
                  fontSize: 13,
                  color: 'var(--texto2)',
                  lineHeight: 1.65,
                  paddingLeft: 16,
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    color: t.color,
                    fontWeight: 700,
                  }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}