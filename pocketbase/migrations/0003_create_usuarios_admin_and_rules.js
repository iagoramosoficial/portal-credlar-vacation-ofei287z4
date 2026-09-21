migrate(
  (app) => {
    // 1. Criar coleção de autenticação usuarios_admin
    // Cadastro público DESATIVADO (createRule: null)
    // Ninguém cria conta pelo site
    const usuariosAdmin = new Collection({
      type: 'auth',
      name: 'usuarios_admin',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null, // Superuser only (cadastro público desativado)
      updateRule: '@request.auth.id != "" && id = @request.auth.id',
      deleteRule: null, // Superuser only
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'papel',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['admin', 'dho'],
        },
      ],
    })
    app.save(usuariosAdmin)

    // 2. Atualizar regras de configuracoes_site
    // Leitura pública; edição somente usuarios_admin autenticados; criação e exclusão somente superusuário
    const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')
    configuracoesSite.listRule = ''
    configuracoesSite.viewRule = ''
    configuracoesSite.createRule = null
    configuracoesSite.updateRule = '@request.auth.collectionName = "usuarios_admin"'
    configuracoesSite.deleteRule = null
    app.save(configuracoesSite)

    // 3. Atualizar regras de cards_home
    // Público lê somente status = "publicado"; usuarios_admin autenticados leem todos (inclusive rascunhos), criam, editam e excluem
    const cardsHome = app.findCollectionByNameOrId('cards_home')
    cardsHome.listRule = 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"'
    cardsHome.viewRule = 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"'
    cardsHome.createRule = '@request.auth.collectionName = "usuarios_admin"'
    cardsHome.updateRule = '@request.auth.collectionName = "usuarios_admin"'
    cardsHome.deleteRule = '@request.auth.collectionName = "usuarios_admin"'
    app.save(cardsHome)

    // 4. Atualizar regras de historico
    // Leitura somente usuarios_admin autenticados; criação interna pelos hooks (superuser)
    const historico = app.findCollectionByNameOrId('historico')
    historico.listRule = '@request.auth.collectionName = "usuarios_admin"'
    historico.viewRule = '@request.auth.collectionName = "usuarios_admin"'
    historico.createRule = null
    historico.updateRule = null
    historico.deleteRule = null
    app.save(historico)

    // 5. Atualizar regras de cliques
    // Leitura somente usuarios_admin autenticados; criação pública mantida
    const cliques = app.findCollectionByNameOrId('cliques')
    cliques.listRule = '@request.auth.collectionName = "usuarios_admin"'
    cliques.viewRule = '@request.auth.collectionName = "usuarios_admin"'
    cliques.createRule = '' // Criação pública mantida
    cliques.updateRule = null
    cliques.deleteRule = null
    app.save(cliques)
  },
  (app) => {
    // Reverter regras de acesso para o estado anterior
    try {
      const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')
      configuracoesSite.updateRule = null
      app.save(configuracoesSite)
    } catch (_) {}

    try {
      const cardsHome = app.findCollectionByNameOrId('cards_home')
      cardsHome.listRule = 'status = "publicado"'
      cardsHome.viewRule = 'status = "publicado"'
      cardsHome.createRule = null
      cardsHome.updateRule = null
      cardsHome.deleteRule = null
      app.save(cardsHome)
    } catch (_) {}

    try {
      const historico = app.findCollectionByNameOrId('historico')
      historico.listRule = null
      historico.viewRule = null
      app.save(historico)
    } catch (_) {}

    try {
      const cliques = app.findCollectionByNameOrId('cliques')
      cliques.listRule = null
      cliques.viewRule = null
      app.save(cliques)
    } catch (_) {}

    try {
      const usuariosAdmin = app.findCollectionByNameOrId('usuarios_admin')
      app.delete(usuariosAdmin)
    } catch (_) {}
  },
)
