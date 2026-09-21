// Hook para garantir que apenas um termo seja vigente por tipo.
// Ao criar ou atualizar um termo com vigente = true, desmarca automaticamente os outros do mesmo tipo.
onRecordValidate((e) => {
  const isVigente = e.record.getBool('vigente')
  if (isVigente) {
    const tipo = e.record.getString('tipo')
    const currentId = e.record.id

    try {
      const filter = currentId
        ? "tipo = '" + tipo + "' && vigente = true && id != '" + currentId + "'"
        : "tipo = '" + tipo + "' && vigente = true"
      const outrostermos = $app.findRecordsByFilter('termos', filter, '', 100, 0)
      for (let i = 0; i < outrostermos.length; i++) {
        const item = outrostermos[i]
        item.set('vigente', false)
        $app.save(item)
      }
    } catch (err) {
      console.log('Erro ao desmarcar outros termos vigentes:', err)
    }
  }

  e.next()
}, 'termos')
