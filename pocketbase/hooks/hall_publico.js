// Rota pública: GET /backend/v1/hall
// Devolve SOMENTE as homenagens que estejam ao mesmo tempo:
// 1. status = 'publicado'
// 2. dentro da vigência por DATA e FUSO HORÁRIO (configuracoes_site.fuso_horario):
//    - publicar_em vale a partir do INÍCIO do dia informado (00:00:00.000 no fuso)
//    - expira_em vale até o FIM do dia informado (23:59:59.999 no fuso)
// 3. lider com status = 'autorizado'
// Devolve: id, nome, area, foto, foto_url (URL montada no servidor a partir do registro do LÍDER),
// categoria, titulo, motivo, periodo, destaque_home, publicar_em, expira_em.

routerAdd('GET', '/backend/v1/hall', (e) => {
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

  // Instante atual em UTC ms
  const agoraMs = Date.now()

  // Converter data informada para UTC ms no início ou fim do dia conforme o fuso
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

  // Buscar homenagens com status = 'publicado'
  let homenagens = []
  try {
    homenagens = $app.findRecordsByFilter(
      'hall_da_fama',
      "status = 'publicado'",
      '-created',
      200,
      0,
    )
  } catch (err) {
    console.log('Erro ao buscar hall_da_fama:', err)
    return e.json(200, [])
  }

  const lideresColId = 'pbc_2305494385'
  const resultado = []

  for (let i = 0; i < homenagens.length; i++) {
    const h = homenagens[i]

    // Checar vigência início: publicar_em vale a partir do início do dia no fuso (00:00:00)
    const publicarEm = h.getString('publicar_em')
    if (publicarEm && publicarEm.trim()) {
      const inicioVigenciaMs = parseDateToUtcMs(publicarEm, false)
      if (inicioVigenciaMs !== null && agoraMs < inicioVigenciaMs) {
        continue
      }
    }

    // Checar vigência fim: expira_em vale até o fim do dia no fuso (23:59:59.999)
    const expiraEm = h.getString('expira_em')
    if (expiraEm && expiraEm.trim()) {
      const fimVigenciaMs = parseDateToUtcMs(expiraEm, true)
      if (fimVigenciaMs !== null && agoraMs > fimVigenciaMs) {
        continue
      }
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

    // O líder DEVE estar com status "autorizado"
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

    resultado.push({
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
      publicar_em: publicarEm || '',
      expira_em: expiraEm || '',
    })
  }

  return e.json(200, resultado)
})
