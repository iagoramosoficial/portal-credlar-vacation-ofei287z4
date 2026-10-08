migrate(
  (app) => {
    // 1. cards_home
    // Criar, editar e excluir SOMENTE @request.auth.papel = "admin"
    // Leitura pública de publicados e leitura completa para usuarios_admin autenticados permanecem como estão.
    const cardsHome = app.findCollectionByNameOrId('cards_home')
    cardsHome.listRule = 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"'
    cardsHome.viewRule = 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"'
    cardsHome.createRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    cardsHome.updateRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    cardsHome.deleteRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    app.save(cardsHome)

    // 2. historico e cliques
    // Leitura SOMENTE @request.auth.papel = "admin"
    // historico: criação/edição/deleção continuam superuser (null)
    const historico = app.findCollectionByNameOrId('historico')
    historico.listRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    historico.viewRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    historico.createRule = null
    historico.updateRule = null
    historico.deleteRule = null
    app.save(historico)

    // cliques: leitura somente admin; criação pública mantida ("")
    const cliques = app.findCollectionByNameOrId('cliques')
    cliques.listRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    cliques.viewRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"'
    cliques.createRule = ''
    cliques.updateRule = null
    cliques.deleteRule = null
    app.save(cliques)

    // 3. configuracoes_site
    // Leitura pública mantida (listRule = '', viewRule = '')
    // Edição completa para papel "admin"
    // Edição para papel "dho" permitida SOMENTE se todos os demais campos NÃO forem enviados (:isset = false).
    // Demais campos da coleção:
    // nome_empresa, hero_linha_1, hero_destaque, hero_frase,
    // rodape_parceria, rodape_metodologia, rodape_frase_1, rodape_frase_2,
    // logo_principal, logo_secundario, titulo_pagina, fuso_horario,
    // cor_primaria, cor_secundaria, cor_destaque, cor_lilas, cor_dourado,
    // cor_fundo_escuro, cor_fundo_gradiente, cor_fundo_claro,
    // mensagem_convite, url_publica, hall_titulo, hall_subtitulo, mensagem_atualizar_foto
    const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')
    configuracoesSite.listRule = ''
    configuracoesSite.viewRule = ''
    configuracoesSite.createRule = null
    configuracoesSite.deleteRule = null

    const dhoCamposBloqueados = [
      '@request.body.nome_empresa:isset = false',
      '@request.body.hero_linha_1:isset = false',
      '@request.body.hero_destaque:isset = false',
      '@request.body.hero_frase:isset = false',
      '@request.body.rodape_parceria:isset = false',
      '@request.body.rodape_metodologia:isset = false',
      '@request.body.rodape_frase_1:isset = false',
      '@request.body.rodape_frase_2:isset = false',
      '@request.body.logo_principal:isset = false',
      '@request.body.logo_secundario:isset = false',
      '@request.body.titulo_pagina:isset = false',
      '@request.body.fuso_horario:isset = false',
      '@request.body.cor_primaria:isset = false',
      '@request.body.cor_secundaria:isset = false',
      '@request.body.cor_destaque:isset = false',
      '@request.body.cor_lilas:isset = false',
      '@request.body.cor_dourado:isset = false',
      '@request.body.cor_fundo_escuro:isset = false',
      '@request.body.cor_fundo_gradiente:isset = false',
      '@request.body.cor_fundo_claro:isset = false',
      '@request.body.mensagem_convite:isset = false',
      '@request.body.url_publica:isset = false',
      '@request.body.hall_titulo:isset = false',
      '@request.body.hall_subtitulo:isset = false',
      '@request.body.mensagem_atualizar_foto:isset = false',
    ].join(' && ')

    configuracoesSite.updateRule =
      '@request.auth.collectionName = "usuarios_admin" && (' +
      '@request.auth.papel = "admin" || ' +
      '(@request.auth.papel = "dho" && ' +
      dhoCamposBloqueados +
      ')' +
      ')'

    app.save(configuracoesSite)
  },
  (app) => {
    // Reverter para estado anterior
    try {
      const cardsHome = app.findCollectionByNameOrId('cards_home')
      cardsHome.createRule = '@request.auth.collectionName = "usuarios_admin"'
      cardsHome.updateRule = '@request.auth.collectionName = "usuarios_admin"'
      cardsHome.deleteRule = '@request.auth.collectionName = "usuarios_admin"'
      app.save(cardsHome)
    } catch (_) {}

    try {
      const historico = app.findCollectionByNameOrId('historico')
      historico.listRule = '@request.auth.collectionName = "usuarios_admin"'
      historico.viewRule = '@request.auth.collectionName = "usuarios_admin"'
      app.save(historico)
    } catch (_) {}

    try {
      const cliques = app.findCollectionByNameOrId('cliques')
      cliques.listRule = '@request.auth.collectionName = "usuarios_admin"'
      cliques.viewRule = '@request.auth.collectionName = "usuarios_admin"'
      app.save(cliques)
    } catch (_) {}

    try {
      const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')
      configuracoesSite.updateRule = '@request.auth.collectionName = "usuarios_admin"'
      app.save(configuracoesSite)
    } catch (_) {}
  },
)
