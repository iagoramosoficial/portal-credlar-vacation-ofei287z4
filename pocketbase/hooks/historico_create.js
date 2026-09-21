// Hook de Criação (configuracoes_site e cards_home)
onRecordAfterCreateSuccess(
  (e) => {
    try {
      const collectionName = e.record.collection().name
      const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
      let depois = null
      try {
        depois = e.record.publicExport ? e.record.publicExport() : null
      } catch (_) {}

      const historicoCol = $app.findCollectionByNameOrId('historico')
      const record = new Record(historicoCol)
      record.set('colecao', collectionName)
      record.set('registro_id', e.record.id)
      record.set('acao', 'criar')
      record.set('usuario', userId)
      record.set('depois', depois)
      $app.save(record)
    } catch (err) {
      console.log('Erro ao gravar historico de criacao:', err)
    }
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)
