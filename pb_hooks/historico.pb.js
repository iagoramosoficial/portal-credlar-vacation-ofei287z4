/// <reference path="../pb_data/types.d.ts" />

function getRecordState(record) {
  if (!record) return null
  try {
    return record.publicExport ? record.publicExport() : null
  } catch {
    return null
  }
}

function recordAuditHistory(app, collectionName, recordId, acao, usuario, antes, depois) {
  try {
    const historicoCol = app.findCollectionByNameOrId('historico')
    const record = new Record(historicoCol)
    record.set('colecao', collectionName)
    record.set('registro_id', recordId)
    record.set('acao', acao)
    record.set('usuario', usuario || 'sistema')
    record.set('antes', antes || null)
    record.set('depois', depois || null)
    app.save(record)
  } catch (err) {
    console.log('Erro ao gravar historico de auditoria:', err)
  }
}

// Hook de Criação (configuracoes_site e cards_home)
onRecordAfterCreateSuccess(
  (e) => {
    const collectionName = e.record.collection().name
    const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
    const depois = getRecordState(e.record)
    recordAuditHistory(e.app, collectionName, e.record.id, 'criar', userId, null, depois)
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)

// Hook de Edição (configuracoes_site e cards_home)
onRecordAfterUpdateSuccess(
  (e) => {
    const collectionName = e.record.collection().name
    const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
    const antes = getRecordState(e.record.original())
    const depois = getRecordState(e.record)
    recordAuditHistory(e.app, collectionName, e.record.id, 'editar', userId, antes, depois)
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)

// Hook de Exclusão (configuracoes_site e cards_home)
onRecordAfterDeleteSuccess(
  (e) => {
    const collectionName = e.record.collection().name
    const userId = e.auth && e.auth.id ? e.auth.id : 'sistema'
    const antes = getRecordState(e.record)
    recordAuditHistory(e.app, collectionName, e.record.id, 'excluir', userId, antes, null)
    e.next()
  },
  'configuracoes_site',
  'cards_home',
)
