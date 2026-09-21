// Hook de Atualização (configuracoes_site e cards_home)
onRecordAfterUpdateSuccess(
  (e) => {
    try {
      const collectionName = e.record.collection().name
      const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
      let antes = null
      let depois = null
      try {
        const orig = e.record.original()
        antes = orig && orig.publicExport ? orig.publicExport() : null
      } catch (_) {}
      try {
        depois = e.record.publicExport ? e.record.publicExport() : null
      } catch (_) {}

      const historicoCol = $app.findCollectionByNameOrId('historico')
      const record = new Record(historicoCol)
      record.set('colecao', collectionName)
      record.set('registro_id', e.record.id)
      record.set('acao', 'editar')
      record.set('usuario', userId)
      record.set('antes', antes)
      record.set('depois', depois)
      $app.save(record)
    } catch (err) {
      console.log('Erro ao gravar historico de edicao:', err)
    }
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)
