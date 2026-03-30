const subirImagen = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setGuardando(true)

  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
  const { data, error } = await supabase.storage
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