// Hook de Atualização (configuracoes_site, cards_home, parametros, termos)
// Intercepta a requisição HTTP para capturar e.auth e registrar auditoria com o e-mail do autor
onRecordUpdateRequest(
  (e) => {
    let antes = null
    try {
      const orig = e.record.original()
      antes = orig && orig.publicExport ? orig.publicExport() : null
    } catch (_) {}

    // Executa a atualização do registro
    e.next()

    try {
      const collectionName = e.record.collection().name
      let userIdent = 'sistema'

      const authRecord = e.auth
      if (authRecord) {
        if (typeof authRecord.email === 'function') {
          userIdent = authRecord.email() || authRecord.id || 'sistema'
        } else if (authRecord.email) {
          userIdent = authRecord.email
        } else if (typeof authRecord.getString === 'function') {
          userIdent = authRecord.getString('email') || authRecord.id || 'sistema'
        } else if (authRecord.id) {
          userIdent = authRecord.id
        }
      }

      let depois = null
      try {
        depois = e.record.publicExport ? e.record.publicExport() : null
      } catch (_) {}

      const historicoCol = $app.findCollectionByNameOrId('historico')
      const histRecord = new Record(historicoCol)
      histRecord.set('colecao', collectionName)
      histRecord.set('registro_id', e.record.id)
      histRecord.set('acao', 'editar')
      histRecord.set('usuario', userIdent)
      histRecord.set('antes', antes)
      histRecord.set('depois', depois)
      $app.save(histRecord)
    } catch (err) {
      console.log('Erro ao gravar historico de edicao:', err)
    }
  },
  'configuracoes_site',
  'cards_home',
  'parametros',
  'termos',
)
