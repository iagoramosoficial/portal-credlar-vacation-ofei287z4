// Rota: POST /api/cadastro/{token}/revogar
// Público. Só para status "autorizado".
// Define status "revogado", APAGA a foto imediatamente e registra em consentimentos (acao revogacao, origem portal, registrado_por "titular").
// Após autorizar, o mesmo link continua válido apenas para revogação.
routerAdd('POST', '/backend/v1/cadastro/{token}/revogar', (e) => {
  const token = e.requestInfo().pathParams.token
  if (!token || token.length < 10) {
    return e.json(404, { message: 'Convite inválido ou expirado.' })
  }

  let lider
  try {
    lider = $app.findFirstRecordByData('lideres', 'token_convite', token)
  } catch (_) {
    return e.json(404, { message: 'Convite inválido ou expirado.' })
  }

  if (!lider) {
    return e.json(404, { message: 'Convite inválido ou expirado.' })
  }

  const currentStatus = lider.getString('status')
  if (currentStatus !== 'autorizado') {
    return e.json(400, { message: 'Apenas cadastros previamente autorizados podem ser revogados.' })
  }

  const termoAceitoId = lider.getString('termo_aceito')
  let versaoTermo = 0
  if (termoAceitoId) {
    try {
      const t = $app.findFirstRecordByData('termos', 'id', termoAceitoId)
      if (t) versaoTermo = t.getInt('versao')
    } catch (_) {}
  }

  lider.set('status', 'revogado')
  lider.set('foto', null)
  $app.save(lider)

  try {
    const consentimentosCol = $app.findCollectionByNameOrId('consentimentos')
    const consRecord = new Record(consentimentosCol)
    consRecord.set('lider', lider.id)
    if (termoAceitoId) {
      consRecord.set('termo', termoAceitoId)
      consRecord.set('versao_termo', versaoTermo)
    }
    consRecord.set('acao', 'revogacao')
    consRecord.set('origem', 'portal')
    consRecord.set('registrado_por', 'titular')
    $app.save(consRecord)
  } catch (err) {
    console.log('Erro ao salvar consentimento de revogacao:', err)
  }

  return e.json(200, {
    status: 'revogado',
    message: 'Autorização revogada e foto removida com sucesso.',
  })
})
