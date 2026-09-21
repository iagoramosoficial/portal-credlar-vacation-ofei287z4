// Hook de Exclusão (configuracoes_site, cards_home, parametros, termos)
// Intercepta a requisição HTTP para capturar e.auth e registrar auditoria com o e-mail do autor
onRecordDeleteRequest(
  (e) => {
    let antes = null
    try {
      antes = e.record.publicExport ? e.record.publicExport() : null
      if (antes && typeof antes === 'object' && 'token_convite' in antes) {
        delete antes.token_convite
      }
    } catch (_) {}

    const collectionName = e.record.collection().name
    const recordId = e.record.id
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

    // Executa a exclusão do registro
    e.next()

    try {
      const historicoCol = $app.findCollectionByNameOrId('historico')
      const histRecord = new Record(historicoCol)
      histRecord.set('colecao', collectionName)
      histRecord.set('registro_id', recordId)
      histRecord.set('acao', 'excluir')
      histRecord.set('usuario', userIdent)
      histRecord.set('antes', antes)
      $app.save(histRecord)
    } catch (err) {
      console.log('Erro ao gravar historico de exclusao:', err)
    }
  },
  'configuracoes_site',
  'cards_home',
  'parametros',
  'termos',
  'lideres',
)
