migrate(
  (app) => {
    // 1. Novos campos em configuracoes_site: hall_titulo e hall_subtitulo
    const configCol = app.findCollectionByNameOrId('configuracoes_site')
    if (!configCol.fields.getByName('hall_titulo')) {
      configCol.fields.add(
        new TextField({
          name: 'hall_titulo',
        }),
      )
    }
    if (!configCol.fields.getByName('hall_subtitulo')) {
      configCol.fields.add(
        new TextField({
          name: 'hall_subtitulo',
        }),
      )
    }
    app.save(configCol)

    // Seed de hall_titulo em configuracoes_site
    try {
      const cRecords = app.findRecordsByFilter('configuracoes_site', '', '', 10, 0)
      for (const rec of cRecords) {
        if (!rec.getString('hall_titulo')) {
          rec.set('hall_titulo', 'Hall da Fama')
          app.save(rec)
        }
      }
    } catch (_) {}

    // 2. Nova coleção hall_da_fama
    // Regras: acesso somente a usuarios_admin autenticados (admin e dho). NENHUM acesso público direto.
    // created/updated autodates obrigatórios em base collection.
    const lideresCol = app.findCollectionByNameOrId('lideres')

    const hallDaFama = new Collection({
      type: 'base',
      name: 'hall_da_fama',
      listRule: '@request.auth.collectionName = "usuarios_admin"',
      viewRule: '@request.auth.collectionName = "usuarios_admin"',
      createRule: '@request.auth.collectionName = "usuarios_admin"',
      updateRule: '@request.auth.collectionName = "usuarios_admin"',
      deleteRule: '@request.auth.collectionName = "usuarios_admin"',
      fields: [
        {
          name: 'lider',
          type: 'relation',
          collectionId: lideresCol.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['destaque', 'tempo_de_casa', 'reconhecimento', 'boas_vindas'],
          maxSelect: 1,
        },
        {
          name: 'titulo',
          type: 'text',
        },
        {
          name: 'motivo',
          type: 'text',
          required: true,
        },
        {
          name: 'periodo',
          type: 'text',
        },
        {
          name: 'publicar_em',
          type: 'date',
        },
        {
          name: 'expira_em',
          type: 'date',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'publicado', 'arquivado'],
          maxSelect: 1,
        },
        {
          name: 'destaque_home',
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
      indexes: [
        'CREATE INDEX idx_hall_status_vigencia ON hall_da_fama (status, publicar_em, expira_em)',
        'CREATE INDEX idx_hall_lider ON hall_da_fama (lider)',
      ],
    })
    app.save(hallDaFama)
  },
  (app) => {
    try {
      const hallDaFama = app.findCollectionByNameOrId('hall_da_fama')
      app.delete(hallDaFama)
    } catch (_) {}

    try {
      const configCol = app.findCollectionByNameOrId('configuracoes_site')
      configCol.fields.removeByName('hall_titulo')
      configCol.fields.removeByName('hall_subtitulo')
      app.save(configCol)
    } catch (_) {}
  },
)
