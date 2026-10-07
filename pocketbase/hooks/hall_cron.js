// Gatilho agendado diário (cronAdd)
// Executa todos os dias às 03:00 UTC (meia-noite de Brasília)
// 1. Arquivar automaticamente homenagens cujo expira_em tenha vencido (expira_em < agora)
// 2. Publicar automaticamente as que estejam com status "publicado" ou agendadas, garantindo integridade
// Também desativa destaque_home quando expirar ou arquivar.
cronAdd('hall_da_fama_vigencia_diaria', '0 3 * * *', () => {
  const agoraIso = new Date().toISOString()
  console.log('Executando cron hall_da_fama_vigencia_diaria em:', agoraIso)

  try {
    // 1. Buscar homenagens com status = 'publicado' e expira_em < agora
    const expiradas = $app.findRecordsByFilter(
      'hall_da_fama',
      "status = 'publicado' && expira_em != ''",
      '',
      500,
      0,
    )

    let totalArquivadas = 0
    for (let i = 0; i < expiradas.length; i++) {
      const h = expiradas[i]
      const expiraEm = h.getString('expira_em')
      if (expiraEm && expiraEm < agoraIso) {
        h.set('status', 'arquivado')
        h.set('destaque_home', false)
        $app.save(h)
        totalArquivadas++
      }
    }
    if (totalArquivadas > 0) {
      console.log('Cron Hall da Fama: ' + totalArquivadas + ' homenagens arquivadas por validade.')
    }
  } catch (err) {
    console.log('Erro no cron hall_da_fama_vigencia_diaria:', err)
  }
})
