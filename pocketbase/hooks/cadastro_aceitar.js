// Rota: POST /api/cadastro/{token}/aceitar
// Público, multipart form.
// Recebe: nome_exibicao, data_admissao, foto (obrigatória), aceite (bool/string 'true').
// Salva os dados no registro do líder:
// - nome_exibicao
// - data_admissao
// - foto
// - status = "autorizado"
// - termo_aceito = termo vigente id
// Registra em consentimentos:
// - lider: lider.id
// - termo: termo vigente id
// - versao_termo: versao do termo
// - acao: "aceite"
// - origem: "portal"
// - registrado_por: "titular"
// Só aceita se status for "convidado" e convite não expirado.
routerAdd('POST', '/backend/v1/cadastro/{token}/aceitar', (e) => {
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

  if (nomeExibicao) {
    lider.set('nome_exibicao', nomeExibicao)
  }
  if (dataAdmissao) {
    lider.set('data_admissao', dataAdmissao)
  }

  lider.set('foto', fotoFile)
  lider.set('status', 'autorizado')
  lider.set('termo_aceito', termoVigente.id)
  $app.save(lider)

  // Criar registro de consentimento
  try {
    const consentimentosCol = $app.findCollectionByNameOrId('consentimentos')
    const consRecord = new Record(consentimentosCol)
    consRecord.set('lider', lider.id)
    consRecord.set('termo', termoVigente.id)
    consRecord.set('versao_termo', termoVigente.getInt('versao'))
    consRecord.set('acao', 'aceite')
    consRecord.set('origem', 'portal')
    consRecord.set('registrado_por', 'titular')
    $app.save(consRecord)
  } catch (err) {
    console.log('Erro ao salvar consentimento de aceite:', err)
  }

  return e.json(200, {
    status: 'autorizado',
    message: 'Autorização concedida com sucesso.',
  })
})
