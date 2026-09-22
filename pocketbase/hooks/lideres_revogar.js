// Rota: POST /api/lideres/{id}/revogar
// Somente usuarios_admin autenticados (para pedidos recebidos por e-mail).
// Define status "revogado", APAGA a foto imediatamente e registra em consentimentos (acao revogacao, origem painel, registrado_por = email do usuario autenticado).
// A atualização do líder e a criação do registro em consentimentos devem acontecer dentro de UMA transação ($app.runInTransaction).
// Se qualquer uma das gravações falhar, nada é salvo e a rota devolve erro.
routerAdd(
  'POST',
  '/backend/v1/lideres/{id}/revogar',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Acesso não autorizado.' })
    }

    const collectionName = auth.collection ? auth.collection().name || '' : ''
    if (collectionName !== 'usuarios_admin') {
      return e.json(403, {
        message: 'Apenas administradores podem revogar autorizações pelo painel.',
      })
    }

    const liderId = e.request.pathValue('id')
    if (!liderId) {
      return e.json(400, { message: 'ID do líder é obrigatório.' })
    }

    let lider
    try {
      lider = $app.findFirstRecordByData('lideres', 'id', liderId)
    } catch (_) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    if (!lider) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    let adminEmail = 'painel'
    if (typeof auth.email === 'function') {
      adminEmail = auth.email() || auth.id || 'painel'
    } else if (auth.email) {
      adminEmail = auth.email
    } else if (typeof auth.getString === 'function') {
      adminEmail = auth.getString('email') || auth.id || 'painel'
    } else if (auth.id) {
      adminEmail = auth.id
    }

    const termoAceitoId = lider.getString('termo_aceito')
    let versaoTermo = 0
    if (termoAceitoId) {
      try {
        const t = $app.findFirstRecordByData('termos', 'id', termoAceitoId)
        if (t) versaoTermo = t.getInt('versao')
      } catch (_) {}
    }

    try {
      $app.runInTransaction((txApp) => {
        const txLider = txApp.findFirstRecordByData('lideres', 'id', lider.id)
        txLider.set('status', 'revogado')
        txLider.set('foto', null)
        txApp.save(txLider)

        const consentimentosCol = txApp.findCollectionByNameOrId('consentimentos')
        const consRecord = new Record(consentimentosCol)
        consRecord.set('lider', txLider.id)
        if (termoAceitoId) {
          consRecord.set('termo', termoAceitoId)
          consRecord.set('versao_termo', versaoTermo)
        }
        consRecord.set('acao', 'revogacao')
        consRecord.set('origem', 'painel')
        consRecord.set('registrado_por', adminEmail)
        txApp.save(consRecord)
      })
    } catch (err) {
      console.log('Erro na transação de revogação pelo painel:', err)
      return e.json(500, {
        message: 'Erro ao revogar autorização pelo painel. Por favor, tente novamente.',
      })
    }

    return e.json(200, {
      status: 'revogado',
      message: 'Autorização revogada pelo painel e foto removida com sucesso.',
    })
  },
  $apis.requireAuth(),
)
