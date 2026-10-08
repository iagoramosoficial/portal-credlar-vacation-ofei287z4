migrate(
  (app) => {
    // 1. Campo mensagem_atualizar_foto em configuracoes_site
    const configCol = app.findCollectionByNameOrId('configuracoes_site')
    if (!configCol.fields.getByName('mensagem_atualizar_foto')) {
      configCol.fields.add(
        new TextField({
          name: 'mensagem_atualizar_foto',
        }),
      )
    }
    app.save(configCol)

    // Seed exato de mensagem_atualizar_foto em configuracoes_site
    const seedMensagemAtualizarFoto =
      'Olá, {nome}! Para ajustar a sua foto no Hall da Fama, acesse: {link}. É só arrastar e dar zoom até o rosto ficar centralizado.'
    try {
      const cRecords = app.findRecordsByFilter('configuracoes_site', '', '', 10, 0)
      for (const rec of cRecords) {
        if (!rec.getString('mensagem_atualizar_foto')) {
          rec.set('mensagem_atualizar_foto', seedMensagemAtualizarFoto)
          app.save(rec)
        }
      }
    } catch (_) {}

    // 2. Nova coleção eventos
    // Regras: leitura pública somente de status "publicado"
    // criação, edição e exclusão somente usuarios_admin autenticados
    const eventos = new Collection({
      type: 'base',
      name: 'eventos',
      listRule: 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"',
      viewRule: 'status = "publicado" || @request.auth.collectionName = "usuarios_admin"',
      createRule: '@request.auth.collectionName = "usuarios_admin"',
      updateRule: '@request.auth.collectionName = "usuarios_admin"',
      deleteRule: '@request.auth.collectionName = "usuarios_admin"',
      fields: [
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
        },
        {
          name: 'imagem',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'data_hora_inicio',
          type: 'date',
          required: true,
        },
        {
          name: 'data_hora_fim',
          type: 'date',
        },
        {
          name: 'local',
          type: 'text',
        },
        {
          name: 'link',
          type: 'url',
        },
        {
          name: 'link_fotos',
          type: 'url',
        },
        {
          name: 'destaque_home',
          type: 'bool',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'publicado', 'arquivado'],
          maxSelect: 1,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_eventos_status_inicio ON eventos (status, data_hora_inicio)',
        'CREATE INDEX idx_eventos_destaque ON eventos (destaque_home)',
      ],
    })
    app.save(eventos)

    // 3. Nova coleção links_curtos
    // Regras: leitura e escrita somente usuarios_admin autenticados. Nenhum acesso público direto.
    const linksCurtos = new Collection({
      type: 'base',
      name: 'links_curtos',
      listRule: '@request.auth.collectionName = "usuarios_admin"',
      viewRule: '@request.auth.collectionName = "usuarios_admin"',
      createRule: '@request.auth.collectionName = "usuarios_admin"',
      updateRule: '@request.auth.collectionName = "usuarios_admin"',
      deleteRule: '@request.auth.collectionName = "usuarios_admin"',
      fields: [
        {
          name: 'apelido',
          type: 'text',
          required: true,
          pattern: '^[a-z0-9-]+$',
        },
        {
          name: 'destino',
          type: 'url',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
        },
        {
          name: 'ativo',
          type: 'bool',
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_links_curtos_apelido ON links_curtos (apelido)'],
    })
    app.save(linksCurtos)

    // 4. Atualizar card "Calendário UniCredlar" na coleção cards_home para apontar para /agenda
    try {
      const cards = app.findRecordsByFilter(
        'cards_home',
        "icone = 'Calendar' || titulo ~ 'Calendário'",
        '',
        10,
        0,
      )
      for (const card of cards) {
        app
          .db()
          .newQuery(
            "UPDATE cards_home SET link = '/agenda', clicavel = 1, selo_texto = '', selo_estilo = '', texto_botao = 'Ver Agenda' WHERE id = {:id}",
          )
          .bind({ id: card.id })
          .execute()
      }
    } catch (err) {
      console.log('Erro ao atualizar card Calendário:', err)
    }
  },
  (app) => {
    try {
      const eventos = app.findCollectionByNameOrId('eventos')
      app.delete(eventos)
    } catch (_) {}

    try {
      const linksCurtos = app.findCollectionByNameOrId('links_curtos')
      app.delete(linksCurtos)
    } catch (_) {}

    try {
      const configCol = app.findCollectionByNameOrId('configuracoes_site')
      configCol.fields.removeByName('mensagem_atualizar_foto')
      app.save(configCol)
    } catch (_) {}
  },
)
