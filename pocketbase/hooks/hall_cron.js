// Gatilho agendado diário (cronAdd)
// Executa todos os dias às 03:00 UTC (meia-noite de Brasília)
// 1. Arquivar automaticamente homenagens cujo expira_em tenha vencido:
//    - expira_em vale até o FIM do dia informado (23:59:59.999 no fuso de configuracoes_site)
//    - se agora no fuso ultrapassou o fim do dia de expira_em, altera status para 'arquivado' e destaque_home para false
// 2. Arquivar automaticamente eventos cuja data de término (ou início, quando não houver término) já passou no fuso configurado:
//    - data_hora_fim ou data_hora_inicio ultrapassou agoraMs
//    - altera status para 'arquivado' e destaque_home para false
// 3. Desativa destaque_home quando expirar ou arquivar.
cronAdd('hall_da_fama_vigencia_diaria', '0 3 * * *', () => {
  const agoraMs = Date.now()
  console.log('Executando cron hall_da_fama_vigencia_diaria em:', new Date().toISOString())

  // Obter fuso configurado
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
    console.log('Erro ao buscar fuso no cron hall_da_fama_vigencia_diaria:', err)
  }

  function parseDateToUtcMs(valStr, isEndOfDay) {
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

  try {
    // Buscar homenagens com status = 'publicado' e expira_em preenchido
    const publicadas = $app.findRecordsByFilter(
      'hall_da_fama',
      "status = 'publicado' && expira_em != ''",
      '',
      500,
      0,
    )

    let totalArquivadas = 0
    for (let i = 0; i < publicadas.length; i++) {
      const h = publicadas[i]
      const expiraEm = h.getString('expira_em')
      if (expiraEm && expiraEm.trim()) {
        const fimVigenciaMs = parseDateToUtcMs(expiraEm, true)
        if (fimVigenciaMs !== null && agoraMs > fimVigenciaMs) {
          h.set('status', 'arquivado')
          h.set('destaque_home', false)
          $app.save(h)
          totalArquivadas++
        }
      }
    }
    if (totalArquivadas > 0) {
      console.log(
        'Cron Hall da Fama: ' +
          totalArquivadas +
          ' homenagens arquivadas por validade no fuso ' +
          fuso +
          '.',
      )
    }

    // 2. Arquivar eventos passados da coleção eventos
    // Busca eventos publicados
    const eventosPublicados = $app.findRecordsByFilter(
      'eventos',
      "status = 'publicado'",
      '',
      500,
      0,
    )

    let totalEventosArquivados = 0
    for (let j = 0; j < eventosPublicados.length; j++) {
      const ev = eventosPublicados[j]
      const dataFim = ev.getString('data_hora_fim')
      const dataInicio = ev.getString('data_hora_inicio')
      const dataReferencia = dataFim && dataFim.trim() ? dataFim : dataInicio

      if (dataReferencia && dataReferencia.trim()) {
        const refMs = parseDateToUtcMs(dataReferencia, false)
        if (refMs !== null && agoraMs > refMs) {
          ev.set('status', 'arquivado')
          ev.set('destaque_home', false)
          $app.save(ev)
          totalEventosArquivados++
        }
      }
    }

    if (totalEventosArquivados > 0) {
      console.log(
        'Cron Eventos: ' +
          totalEventosArquivados +
          ' eventos passados arquivados no fuso ' +
          fuso +
          '.',
      )
    }
  } catch (err) {
    console.log('Erro no cron hall_da_fama_vigencia_diaria:', err)
  }
})
