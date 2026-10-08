// Rota pública para resolução e redirecionamento de links curtos
// Rota: GET /backend/v1/r/{apelido}
// Acesso: público.
// Busca na coleção links_curtos por apelido e ativo = true.
// Se ativo, grava telemetria na coleção cliques (tipo "link_curto", alvo = apelido)
// e devolve { destino: url }.
// Se inexistente ou inativo, devolve 404.

routerAdd('GET', '/backend/v1/r/{apelido}', (e) => {
  const apelido = e.request.pathValue('apelido')
  if (!apelido || !apelido.trim()) {
    return e.json(404, { message: 'Link curto não informado.' })
  }

  const apelidoFormatado = apelido.trim().toLowerCase()

  let linkRecord
  try {
    linkRecord = $app.findFirstRecordByData('links_curtos', 'apelido', apelidoFormatado)
  } catch (_) {
    return e.json(404, { message: 'Link não encontrado ou inativo.' })
  }

  if (!linkRecord) {
    return e.json(404, { message: 'Link não encontrado ou inativo.' })
  }

  const ativo = linkRecord.getBool('ativo')
  if (!ativo) {
    return e.json(404, { message: 'Este link curto está desativado.' })
  }

  const destino = linkRecord.getString('destino')
  if (!destino || !destino.trim()) {
    return e.json(404, { message: 'Destino do link não configurado.' })
  }

  // Registrar clique na coleção cliques (telemetria sem dados pessoais)
  try {
    const cliquesCol = $app.findCollectionByNameOrId('cliques')
    const cliqueRec = new Record(cliquesCol)
    cliqueRec.set('alvo', apelidoFormatado)
    cliqueRec.set('tipo', 'link_curto')
    $app.save(cliqueRec)
  } catch (err) {
    console.log('Erro ao gravar telemetria do link curto:', err)
  }

  return e.json(200, {
    apelido: apelidoFormatado,
    destino: destino.trim(),
  })
})
