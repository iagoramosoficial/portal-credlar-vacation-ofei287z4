// Rota: POST /api/lideres/{id}/convite
// Somente usuarios_admin autenticados (admin e dho).
//
// 2. CONVITE BLOQUEADO PARA QUEM JÁ AUTORIZOU:
// - Recusar a geração de convite quando o status do líder for "autorizado", com a mensagem exata:
//   "Este líder já autorizou. Para um novo convite, registre antes a revogação."
// - Para os demais status (pendente, convidado, recusado, revogado), manter o comportamento atual.
// - Remover o gerador alternativo com Math.random: usar somente $security.randomString(48); se indisponível, devolver erro.
//
// Se NÃO houver termo vigente do tipo uso_imagem, recusa com:
// "Cadastre e torne vigente um termo de uso de imagem em Configurações antes de convidar."
// Gera token aleatório seguro (48 chars via $security.randomString(48)), define convite_expira_em com base em dias_validade_convite de parametros,
// status "convidado", e devolve { link: "/cadastro/" + token, token: token, expira_em: convite_expira_em }.
routerAdd(
  'POST',
  '/backend/v1/lideres/{id}/convite',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Acesso não autorizado.' })
    }

    const collectionName = auth.collection ? auth.collection().name || '' : ''
    if (collectionName !== 'usuarios_admin') {
      return e.json(403, { message: 'Apenas administradores podem gerar convites.' })
    }

    const liderId = e.requestInfo().pathParams.id
    if (!liderId) {
      return e.json(400, { message: 'ID do líder é obrigatório.' })
    }

    let liderRecord
    try {
      liderRecord = $app.findFirstRecordByData('lideres', 'id', liderId)
    } catch (_) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    if (!liderRecord) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    // Regra: Bloquear geração de convite para quem já autorizou
    const currentStatus = liderRecord.getString('status')
    if (currentStatus === 'autorizado') {
      return e.json(400, {
        message: 'Este líder já autorizou. Para um novo convite, registre antes a revogação.',
      })
    }

    // Verificar se há termo de uso_imagem vigente
    let termoVigente
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

    if (!termoVigente) {
      return e.json(400, {
        message:
          'Cadastre e torne vigente um termo de uso de imagem em Configurações antes de convidar.',
      })
    }

    // Buscar dias_validade_convite de parametros (padrão 15)
    let diasValidade = 15
    try {
      const params = $app.findRecordsByFilter('parametros', '', '', 1, 0)
      if (params && params.length > 0) {
        const val = params[0].getInt('dias_validade_convite')
        if (val > 0) {
          diasValidade = val
        }
      }
    } catch (_) {}

    // Gerador de token: usar SOMENTE $security.randomString(48). Se indisponível, devolver erro.
    let token = ''
    try {
      if (typeof $security !== 'undefined' && typeof $security.randomString === 'function') {
        token = $security.randomString(48)
      }
    } catch (err) {
      console.log('Erro ao chamar $security.randomString:', err)
    }

    if (!token || token.length !== 48) {
      return e.json(500, {
        message: 'Serviço de geração de token criptográfico indisponível.',
      })
    }

    // Calcular data de expiração (UTC ISO)
    const expiraEmDate = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000)
    const expiraEmIso = expiraEmDate.toISOString()

    // Atualizar registro do líder
    try {
      liderRecord.set('token_convite', token)
      liderRecord.set('convite_expira_em', expiraEmIso)
      liderRecord.set('status', 'convidado')
      $app.save(liderRecord)
    } catch (saveErr) {
      console.log('Erro ao salvar líder com convite:', saveErr)
      return e.json(500, {
        message: 'Erro interno ao salvar convite do líder.',
      })
    }

    return e.json(200, {
      link: '/cadastro/' + token,
      token: token,
      expira_em: expiraEmIso,
      dias_validade: diasValidade,
    })
  },
  $apis.requireAuth(),
)
