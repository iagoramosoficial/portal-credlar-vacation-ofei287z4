// Rota pública: GET /backend/v1/hall/arquivo
// Homenagens já expiradas (status = 'publicado' e expira_em < agora no fuso) ou com status = 'arquivado'
// Regra de vigência de expira_em: vale até o FIM do dia informado (23:59:59.999 no fuso de configuracoes_site)
// LÍDER DEVE ESTAR COM STATUS "autorizado" — Líder revogado ou recusado NUNCA aparece!
// Suporta paginação via query params: page (default 1), perPage (default 12)
// Devolve: { items: [...], totalItems: number, page: number, perPage: number, totalPages: number }

routerAdd('GET', '/backend/v1/hall/arquivo', (e) => {
  // 1. Obter fuso configurado
  let fuso = 'America/Sao_Paulo'
  try {
    const configs = $app.findRecordsByFilter('configuracoes_site', '', '', 1, 0)
    if (configs && configs.length > 0) {
      const f = configs[0].getString('fuso_horario')
      if (f && f.trim()) {
        fuso = f.trim()
      }
    }
  } catch (err) {
    console.log('Erro ao buscar fuso em configuracoes_site:', err)
  }

  const agoraMs = Date.now()

  // Função interna para obter timestamp de início/fim do dia no fuso configurado
  const parseDateToUtcMs = (valStr, isEndOfDay) => {
    if (!valStr || !valStr.trim()) return null
    const s = valStr.trim()
    let datePart = ''
    if (s.indexOf('T') !== -1) {
      datePart = s.split('T')[0]
    } else if (s.indexOf(' ') !== -1) {
      datePart = s.split(' ')[0]
    } else {
      datePart = s
    }

    const parts = datePart.split('-')
    if (parts.length < 3) {
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d.getTime()
    }

    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const day = parseInt(parts[2], 10)
    const hour = isEndOfDay ? 23 : 0
    const minute = isEndOfDay ? 59 : 0
    const second = isEndOfDay ? 59 : 0
    const ms = isEndOfDay ? 999 : 0

    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms))
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: fuso,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      })
      const tzParts = dtf.formatToParts(utcGuess)
      const tzObj = {}
      for (let i = 0; i < tzParts.length; i++) {
        const p = tzParts[i]
        if (p.type !== 'literal') {
          tzObj[p.type] = parseInt(p.value, 10)
        }
      }
      let h = tzObj.hour === 24 ? 0 : tzObj.hour
      const asTz = new Date(
        Date.UTC(tzObj.year, tzObj.month - 1, tzObj.day, h, tzObj.minute, tzObj.second, ms),
      )
      const offset = asTz.getTime() - utcGuess.getTime()
      return utcGuess.getTime() - offset
    } catch (_) {
      const offsetMs = -3 * 60 * 60 * 1000
      return Date.UTC(year, month - 1, day, hour, minute, second, ms) - offsetMs
    }
  }

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

  const lideresColId = 'pbc_2305494385'
  const candidatos = []

  for (let i = 0; i < todas.length; i++) {
    const h = todas[i]
    const status = h.getString('status')
    const expiraEm = h.getString('expira_em')

    // É arquivo se:
    // status for 'arquivado' OU
    // (status for 'publicado' e expiraEm preenchido e expira_em já terminou — isto é, após 23:59:59 do dia no fuso)
    let isExpirado = false
    if (status === 'publicado' && expiraEm && expiraEm.trim()) {
      const fimVigenciaMs = parseDateToUtcMs(expiraEm, true)
      if (fimVigenciaMs !== null && agoraMs > fimVigenciaMs) {
        isExpirado = true
      }
    }
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

    // Montar foto_url a partir do registro do LÍDER (dono da foto)
    let fotoUrl = ''
    if (foto) {
      const colIdentifier = (lider.collection && lider.collection().id) || lideresColId
      fotoUrl =
        '/api/files/' +
        encodeURIComponent(colIdentifier) +
        '/' +
        encodeURIComponent(lider.id) +
        '/' +
        encodeURIComponent(foto)
    }

    candidatos.push({
      id: h.id,
      nome: nomeExibicao,
      area: area,
      foto: foto,
      foto_url: fotoUrl,
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
