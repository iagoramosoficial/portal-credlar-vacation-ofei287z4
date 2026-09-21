// Hook de Exclusão (configuracoes_site e cards_home)
onRecordAfterDeleteSuccess(
  (e) => {
    try {
      const collectionName = e.record.collection().name
      const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
      let antes = null
      try {
        antes = e.record.publicExport ? e.record.publicExport() : null
      } catch (_) {}

      const historicoCol = $app.findCollectionByNameOrId('historico')
      const record = new Record(historicoCol)
      record.set('colecao', collectionName)
      record.set('registro_id', e.record.id)
      record.set('acao', 'excluir')
      record.set('usuario', userId)
      record.set('antes', antes)
      $app.save(record)
    } catch (err) {
      console.log('Erro ao gravar historico de exclusao:', err)
    }
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)
