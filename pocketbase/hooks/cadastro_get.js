// Rota: GET /api/cadastro/{token}
// Público. Devolve APENAS: nome_exibicao (ou nome), status, data de validade e o termo uso_imagem vigente (id, título, versão, conteúdo).
// Token inválido ou expirado: mensagem genérica, sem revelar se o token existe.
routerAdd('GET', '/backend/v1/cadastro/{token}', (e) => {
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

  const status = lider.getString('status') || 'pendente'

  // Se status for recusado ou revogado
  if (status === 'recusado' || status === 'revogado') {
    return e.json(200, {
      status: status,
      message: status === 'revogado' ? 'Autorização revogada.' : 'Convite recusado.',
    })
  }

  // Se já estiver autorizado, permite visualizar que está autorizado (com opção de revogar)
  if (status === 'autorizado') {
    return e.json(200, {
      status: 'autorizado',
      nome_exibicao: lider.getString('nome_exibicao') || lider.getString('nome'),
    })
  }

  // Se status não for convidado, tratar como expirado/inválido
  if (status !== 'convidado') {
    return e.json(404, { message: 'Convite inválido ou expirado.' })
  }

  // Verificar validade
  const expiraEmStr = lider.getString('convite_expira_em')
  if (expiraEmStr) {
    const expiraEm = new Date(expiraEmStr).getTime()
    if (!isNaN(expiraEm) && expiraEm < Date.now()) {
      return e.json(404, { message: 'Convite inválido ou expirado.' })
    }
  }

  // Buscar termo vigente uso_imagem
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
      termoVigente = {
        id: termos[0].id,
        titulo: termos[0].getString('titulo'),
        versao: termos[0].getInt('versao'),
        conteudo: termos[0].getString('conteudo'),
      }
    }
  } catch (_) {}

  const nomeExibicao = lider.getString('nome_exibicao') || lider.getString('nome')

  return e.json(200, {
    status: 'convidado',
    nome_exibicao: nomeExibicao,
    data_validade: expiraEmStr,
    termo: termoVigente,
  })
})
