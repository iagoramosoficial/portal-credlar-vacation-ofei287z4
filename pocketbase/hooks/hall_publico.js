// Rota pública: GET /backend/v1/hall
// e GET /api/hall (para suportar ambas as convenções de chamada)
// Devolve SOMENTE as homenagens que estejam ao mesmo tempo:
// 1. status = 'publicado'
// 2. dentro da vigência: (publicar_em é nulo ou <= agora no fuso) e (expira_em é nulo ou >= agora no fuso)
// 3. lider com status = 'autorizado'
// Devolve APENAS: id, nome_exibicao, area, foto, categoria, titulo, motivo, periodo, destaque_home, publicar_em, expira_em.
// NUNCA devolve token, data_admissao, status interno ou qualquer dado sensível do líder.
routerAdd('GET', '/backend/v1/hall', (e) => {
  const agoraIso = new Date().toISOString()

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

  const resultado = []

  for (let i = 0; i < homenagens.length; i++) {
    const h = homenagens[i]

    // Checar vigência: publicar_em <= agora
    const publicarEm = h.getString('publicar_em')
    if (publicarEm && publicarEm.trim()) {
      if (publicarEm > agoraIso) {
        continue
      }
    }

    // Checar vigência: expira_em >= agora
    const expiraEm = h.getString('expira_em')
    if (expiraEm && expiraEm.trim()) {
      if (expiraEm < agoraIso) {
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

    resultado.push({
      id: h.id,
      nome: nomeExibicao,
      area: area,
      foto: foto,
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
