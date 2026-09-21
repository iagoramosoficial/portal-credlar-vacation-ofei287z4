// Rota: POST /api/cadastro/{token}/recusar
// Público. Status "recusado" e registro em consentimentos (acao recusa, origem portal, registrado_por "titular").
// A atualização do líder e o registro em consentimentos devem acontecer dentro de UMA transação ($app.runInTransaction).
// Se qualquer uma das gravações falhar, nada é salvo e a rota devolve erro.
routerAdd('POST', '/backend/v1/cadastro/{token}/recusar', (e) => {
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
  if (currentStatus === 'autorizado') {
    return e.json(400, { message: 'Cadastro já autorizado. Utilize a opção de revogação.' })
  }

  let termoVigente = null
  try {
    const termos = $app.findRecordsByFilter(
      'termos',
      "tipo = 'uso_imagem' && vigente = true",
      '',
      1,
      0,
    )
    if (termos && termos.length > 0) {
      termoVigente = termos[0]
    }
  } catch (_) {}

  try {
    $app.runInTransaction((txApp) => {
      const txLider = txApp.findFirstRecordByData('lideres', 'id', lider.id)
      txLider.set('status', 'recusado')
      txApp.save(txLider)

      const consentimentosCol = txApp.findCollectionByNameOrId('consentimentos')
      const consRecord = new Record(consentimentosCol)
      consRecord.set('lider', txLider.id)
      if (termoVigente) {
        consRecord.set('termo', termoVigente.id)
        consRecord.set('versao_termo', termoVigente.getInt('versao'))
      }
      consRecord.set('acao', 'recusa')
      consRecord.set('origem', 'portal')
      consRecord.set('registrado_por', 'titular')
      txApp.save(consRecord)
    })
  } catch (err) {
    console.log('Erro na transação de recusa:', err)
    return e.json(500, {
      message: 'Erro ao registrar a recusa do convite. Por favor, tente novamente.',
    })
  }

  return e.json(200, {
    status: 'recusado',
    message: 'Convite recusado com sucesso.',
  })
})
