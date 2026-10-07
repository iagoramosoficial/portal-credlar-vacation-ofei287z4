// Rota pública: GET /backend/v1/hall/arquivo
// Homenagens já expiradas (status = 'publicado' e expira_em < agora) ou com status = 'arquivado'
// LÍDER DEVE ESTAR COM STATUS "autorizado" — Líder revogado ou recusado NUNCA aparece!
// Suporta paginação via query params: page (default 1), perPage (default 12)
// Devolve: { items: [...], totalItems: number, page: number, perPage: number, totalPages: number }
routerAdd('GET', '/backend/v1/hall/arquivo', (e) => {
  const agoraIso = new Date().toISOString()
  const page = parseInt(e.request.url.query().get('page') || '1', 10) || 1
  const perPage = parseInt(e.request.url.query().get('perPage') || '12', 10) || 12

  // Buscar todas as homenagens potencialmente arquivadas ou expiradas
  let todas = []
  try {
    todas = $app.findRecordsByFilter(
      'hall_da_fama',
      "status = 'arquivado' || status = 'publicado'",
      '-created',
      500,
      0,
    )
  } catch (err) {
    console.log('Erro ao buscar arquivo do hall_da_fama:', err)
    return e.json(200, { items: [], totalItems: 0, page: 1, perPage: perPage, totalPages: 0 })
  }

  const candidatos = []

  for (let i = 0; i < todas.length; i++) {
    const h = todas[i]
    const status = h.getString('status')
    const expiraEm = h.getString('expira_em')

    // É arquivo se:
    // status for 'arquivado' OU (status for 'publicado' e expiraEm preenchido e expiraEm < agoraIso)
    const isExpirado = status === 'publicado' && expiraEm && expiraEm.trim() && expiraEm < agoraIso
    const isArquivado = status === 'arquivado'

    if (!isArquivado && !isExpirado) {
      continue
    }

    const liderId = h.getString('lider')
    if (!liderId) continue

    let lider = null
    try {
      lider = $app.findFirstRecordByData('lideres', 'id', liderId)
    } catch (_) {
      continue
    }

    if (!lider) continue

    // LÍDER DEVE ESTAR AUTORIZADO
    if (lider.getString('status') !== 'autorizado') {
      continue
    }

    const nomeExibicao = lider.getString('nome_exibicao') || lider.getString('nome') || ''
    const area = lider.getString('area') || ''
    const foto = lider.getString('foto') || ''

    candidatos.push({
      id: h.id,
      nome: nomeExibicao,
      area: area,
      foto: foto,
      categoria: h.getString('categoria'),
      titulo: h.getString('titulo') || '',
      motivo: h.getString('motivo') || '',
      periodo: h.getString('periodo') || '',
      destaque_home: h.getBool('destaque_home') || false,
      publicar_em: h.getString('publicar_em') || '',
      expira_em: expiraEm || '',
    })
  }

  const totalItems = candidatos.length
  const totalPages = Math.ceil(totalItems / perPage) || 1
  const offset = (page - 1) * perPage
  const paginados = candidatos.slice(offset, offset + perPage)

  return e.json(200, {
    items: paginados,
    totalItems: totalItems,
    page: page,
    perPage: perPage,
    totalPages: totalPages,
  })
})
