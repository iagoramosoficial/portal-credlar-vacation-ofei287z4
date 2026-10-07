// Rota: POST /backend/v1/cadastro/{token}/foto
// Público, multipart form.
// Aceita o envio de uma nova foto SOMENTE quando o líder estiver com status "autorizado".
// Substitui a foto, mantém status ("autorizado"), termo aceito e todo o histórico de consentimentos inalterados.
// NÃO cria registro em consentimentos nessa operação: o consentimento não muda.
// Registra a troca no histórico conforme padrão dos hooks existentes.

routerAdd('POST', '/backend/v1/cadastro/{token}/foto', (e) => {
  const token = e.request.pathValue('token')
  if (!token || token.length < 10) {
    return e.json(404, { message: 'Link inválido ou expirado.' })
  }

  let lider
  try {
    lider = $app.findFirstRecordByData('lideres', 'token_convite', token)
  } catch (_) {
    return e.json(404, { message: 'Link inválido ou expirado.' })
  }

  if (!lider) {
    return e.json(404, { message: 'Link inválido ou expirado.' })
  }

  const status = lider.getString('status')
  if (status !== 'autorizado') {
    return e.json(400, {
      message: 'A atualização de foto é permitida apenas para cadastros já autorizados.',
    })
  }

  const reqInfo = e.requestInfo()

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
    return e.json(400, { message: 'O envio de uma nova foto é obrigatório.' })
  }

  const fotoFile = uploadedFiles[0]

  // Snapshot do registro "antes" para auditoria no historico
  let antes = null
  try {
    antes = lider.publicExport ? lider.publicExport() : null
    if (antes && typeof antes === 'object' && 'token_convite' in antes) {
      delete antes.token_convite
    }
  } catch (_) {}

  try {
    // Atualiza apenas a foto do líder
    lider.set('foto', fotoFile)
    $app.save(lider)

    // Snapshot do registro "depois" para auditoria
    let depois = null
    try {
      depois = lider.publicExport ? lider.publicExport() : null
      if (depois && typeof depois === 'object' && 'token_convite' in depois) {
        delete depois.token_convite
      }
    } catch (_) {}

    // Registrar troca de foto no historico
    try {
      const historicoCol = $app.findCollectionByNameOrId('historico')
      const histRecord = new Record(historicoCol)
      histRecord.set('colecao', 'lideres')
      histRecord.set('registro_id', lider.id)
      histRecord.set('acao', 'editar')
      histRecord.set('usuario', 'titular')
      histRecord.set('antes', antes)
      histRecord.set('depois', depois)
      $app.save(histRecord)
    } catch (errHist) {
      console.log('Erro ao gravar historico de atualizacao de foto:', errHist)
    }

    return e.json(200, {
      status: 'autorizado',
      message: 'Foto atualizada com sucesso.',
    })
  } catch (err) {
    console.log('Erro ao atualizar foto do líder:', err)
    return e.json(500, {
      message: 'Erro ao atualizar a foto. Por favor, tente novamente.',
    })
  }
})
