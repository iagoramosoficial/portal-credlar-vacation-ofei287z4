// Rota: POST /api/cadastro/{token}/aceitar
// Público, multipart form.
// Recebe: nome_exibicao, data_admissao, foto (obrigatória), aceite (bool/string 'true'), termo_id (id do termo lido).
//
// 1. TRANSAÇÕES:
// - A atualização do líder e a criação do registro em consentimentos devem acontecer dentro de UMA transação ($app.runInTransaction).
// - Se qualquer uma das gravações falhar, nada é salvo e a rota devolve erro. Sem try/catch ignorando erro de consentimento.
//
// 3. TERMO LIDO = TERMO ACEITO:
// - cadastro_aceitar compara o id recebido com o termo vigente no momento do aceite.
// - Se forem diferentes, recusar com a mensagem exata: "O termo foi atualizado. Recarregue a página e leia a nova versão."
routerAdd('POST', '/backend/v1/cadastro/{token}/aceitar', (e) => {
  const token = e.request.pathValue('token')
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

  const status = lider.getString('status')
  if (status !== 'convidado') {
    return e.json(400, { message: 'Este convite não está mais pendente de aceite.' })
  }

  const expiraEmStr = lider.getString('convite_expira_em')
  if (expiraEmStr) {
    const expiraEm = new Date(expiraEmStr).getTime()
    if (!isNaN(expiraEm) && expiraEm < Date.now()) {
      return e.json(400, { message: 'O prazo deste convite expirou.' })
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
      termoVigente = termos[0]
    }
  } catch (_) {}

  if (!termoVigente) {
    return e.json(400, { message: 'Não há termo de uso de imagem vigente cadastrado.' })
  }

  const reqInfo = e.requestInfo()
  const body = reqInfo.body || {}

  // Conferência do termo lido: termo_id enviado pelo cliente vs termo vigente
  const termoIdEnviado = (body.termo_id || '').toString().trim()
  if (!termoIdEnviado || termoIdEnviado !== termoVigente.id) {
    return e.json(400, {
      message: 'O termo foi atualizado. Recarregue a página e leia a nova versão.',
    })
  }

  const nomeExibicao = (body.nome_exibicao || '').toString().trim()
  const dataAdmissao = (body.data_admissao || '').toString().trim()
  const aceite =
    body.aceite === true || body.aceite === 'true' || body.aceite === '1' || body.aceite === 1

  if (!aceite) {
    return e.json(400, { message: 'Você precisa concordar com o termo de autorização.' })
  }

  // Obter arquivo enviado
  let uploadedFiles = []
  try {
    if (typeof e.findUploadedFiles === 'function') {
      uploadedFiles = e.findUploadedFiles('foto')
    }
  } catch (err) {
    console.log('e.findUploadedFiles error:', err)
  }

  if (!uploadedFiles || uploadedFiles.length === 0) {
    try {
      if (reqInfo.files && reqInfo.files.foto) {
        uploadedFiles = Array.isArray(reqInfo.files.foto)
          ? reqInfo.files.foto
          : [reqInfo.files.foto]
      }
    } catch (_) {}
  }

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return e.json(400, { message: 'O envio de uma foto é obrigatório.' })
  }

  const fotoFile = uploadedFiles[0]

  try {
    $app.runInTransaction((txApp) => {
      // 1. Atualizar líder dentro da transação
      const txLider = txApp.findFirstRecordByData('lideres', 'id', lider.id)
      if (nomeExibicao) {
        txLider.set('nome_exibicao', nomeExibicao)
      }
      if (dataAdmissao) {
        txLider.set('data_admissao', dataAdmissao)
      }
      txLider.set('foto', fotoFile)
      txLider.set('status', 'autorizado')
      txLider.set('termo_aceito', termoVigente.id)
      txApp.save(txLider)

      // 2. Criar registro de consentimento dentro da transação
      const consentimentosCol = txApp.findCollectionByNameOrId('consentimentos')
      const consRecord = new Record(consentimentosCol)
      consRecord.set('lider', txLider.id)
      consRecord.set('termo', termoVigente.id)
      consRecord.set('versao_termo', termoVigente.getInt('versao'))
      consRecord.set('acao', 'aceite')
      consRecord.set('origem', 'portal')
      consRecord.set('registrado_por', 'titular')
      txApp.save(consRecord)
    })
  } catch (err) {
    console.log('Erro na transação de aceite:', err)
    return e.json(500, {
      message: 'Erro ao processar a autorização. Por favor, tente novamente.',
    })
  }

  return e.json(200, {
    status: 'autorizado',
    message: 'Autorização concedida com sucesso.',
  })
})
