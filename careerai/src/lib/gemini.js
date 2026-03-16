const API_KEY = import.meta.env.VITE_GEMINI_KEY              
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'


const SISTEMA = `Eres Ruti, asistente virtual laboral del SENA Colombia. 
Respondes preguntas relacionadas con:
- Hojas de vida y CV
- Entrevistas de trabajo
- Salarios y negociación
- Búsqueda de empleo
- Carrera profesional
- Contratos y derechos laborales
- LinkedIn y networking
- Cambio de carrera
- Cursos, programas y certificaciones del SENA
- Centros de formación del SENA en Colombia
- Inscripciones y requisitos para estudiar en el SENA
- Sofiaplus y trámites del SENA

Si te preguntan algo diferente a estos temas responde:
"Solo puedo ayudarte con temas laborales, de carrera profesional o del SENA. ¿Tienes alguna duda sobre empleo o formación? 🐾"

Responde siempre en español colombiano, de forma clara, práctica y amigable.
Usa emojis ocasionalmente. Máximo 250 palabras por respuesta.`

export async function preguntarGemini(mensajes) {
  try {
    const contenido = mensajes.map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }))

    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SISTEMA }] },
        contents: contenido
      })
    })

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude responder, intenta de nuevo.'
  } catch {
    return 'Error al conectar con la IA. Verifica tu conexión.'
  }
}

export async function mejorarTexto(texto, tipo) {
  try {
    const prompt = `Mejora este texto de hoja de vida para que sea más profesional y orientado a resultados. 
Tipo de sección: ${tipo}
Texto original: "${texto}"
Responde SOLO con el texto mejorado, sin explicaciones.`

    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    })

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || texto
  } catch {
    return texto
  }
}

export async function analizarCV(textoCV, oferta = '') {
  try {
    const prompt = `Analiza esta hoja de vida y devuelve SOLO un JSON válido con esta estructura exacta:
{
  "nombre": "...",
  "cargo_objetivo": "...",
  "email": "...",
  "telefono": "...",
  "ciudad": "...",
  "perfil_profesional": "párrafo optimizado para ATS...",
  "experiencia": [{"cargo":"...","empresa":"...","periodo":"...","logros":["logro 1","logro 2"]}],
  "educacion": [{"titulo":"...","institucion":"...","periodo":"..."}],
  "habilidades": ["skill1","skill2","skill3"],
  "idiomas": [{"idioma":"...","nivel":"..."}],
  "score_ats": 85,
  "mejoras": ["mejora 1","mejora 2","mejora 3"]
}

Hoja de vida: ${textoCV}
${oferta ? `Oferta de trabajo: ${oferta}` : ''}

Responde SOLO con el JSON, sin texto extra.`

    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    })

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}