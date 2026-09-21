migrate(
  (app) => {
    // a) Correção pendente: adicionar à coleção termos um índice ÚNICO em (tipo, versao)
    // Impedindo versões repetidas do mesmo tipo.
    try {
      // Deduplicar antes por segurança (manter o mais antigo)
      app
        .db()
        .newQuery(`
        DELETE FROM termos WHERE id NOT IN (
          SELECT MIN(id) FROM termos GROUP BY tipo, versao
        )
      `)
        .execute()
    } catch (_) {}

    const termosCol = app.findCollectionByNameOrId('termos')
    try {
      termosCol.removeIndex('idx_termos_tipo_versao')
    } catch (_) {}
    termosCol.addIndex('idx_termos_tipo_versao_unique', true, 'tipo, versao', '')
    app.save(termosCol)

    // d) Novos campos em parametros e configuracoes_site
    const parametrosCol = app.findCollectionByNameOrId('parametros')
    if (!parametrosCol.fields.getByName('dias_validade_convite')) {
      parametrosCol.fields.add(
        new NumberField({
          name: 'dias_validade_convite',
          onlyInt: true,
        }),
      )
      app.save(parametrosCol)
    }

    // Seed de dias_validade_convite = 15
    try {
      const pRecords = app.findRecordsByFilter('parametros', '', '', 10, 0)
      for (const rec of pRecords) {
        if (!rec.get('dias_validade_convite')) {
          rec.set('dias_validade_convite', 15)
          app.save(rec)
        }
      }
    } catch (_) {}

    const configCol = app.findCollectionByNameOrId('configuracoes_site')
    if (!configCol.fields.getByName('mensagem_convite')) {
      configCol.fields.add(
        new TextField({
          name: 'mensagem_convite',
        }),
      )
      app.save(configCol)
    }

    // Seed de mensagem_convite
    const defaultMensagemConvite =
      'Olá, {nome}! Você foi convidado(a) para o Hall da Fama da UniCredlar. Para completar seu cadastro e autorizar o uso da sua foto, acesse: {link} (válido até {validade}).'
    try {
      const cRecords = app.findRecordsByFilter('configuracoes_site', '', '', 10, 0)
      for (const rec of cRecords) {
        if (!rec.getString('mensagem_convite')) {
          rec.set('mensagem_convite', defaultMensagemConvite)
          app.save(rec)
        }
      }
    } catch (_) {}

    // b) Nova coleção lideres
    // created/updated autodate
    // Regras: list/view/create/update somente usuarios_admin (admin ou dho).
    // Restrição de campos no create/update do painel: usuarios_admin não podem alterar status, token_convite, convite_expira_em, termo_aceito
    const lideres = new Collection({
      type: 'base',
      name: 'lideres',
      listRule: '@request.auth.collectionName = "usuarios_admin"',
      viewRule: '@request.auth.collectionName = "usuarios_admin"',
      createRule:
        '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false',
      updateRule:
        '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false',
      deleteRule: '@request.auth.collectionName = "usuarios_admin"',
      fields: [
        {
          name: 'nome',
          type: 'text',
          required: true,
        },
        {
          name: 'nome_exibicao',
          type: 'text',
        },
        {
          name: 'area',
          type: 'text',
        },
        {
          name: 'data_admissao',
          type: 'date',
        },
        {
          name: 'foto',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['100x100', '300x300'],
        },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'convidado', 'autorizado', 'recusado', 'revogado'],
          maxSelect: 1,
        },
        {
          name: 'token_convite',
          type: 'text',
          hidden: true,
        },
        {
          name: 'convite_expira_em',
          type: 'date',
        },
        {
          name: 'termo_aceito',
          type: 'relation',
          collectionId: termosCol.id,
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
        'CREATE UNIQUE INDEX idx_lideres_token_convite ON lideres (token_convite) WHERE token_convite IS NOT NULL AND token_convite != ""',
        'CREATE INDEX idx_lideres_status ON lideres (status)',
      ],
    })
    app.save(lideres)

    // c) Nova coleção consentimentos
    // SOMENTE ACRÉSCIMO:
    // Leitura somente usuarios_admin; criação, edição e exclusão nulas (somente servidor / superusuário)
    const consentimentos = new Collection({
      type: 'base',
      name: 'consentimentos',
      listRule: '@request.auth.collectionName = "usuarios_admin"',
      viewRule: '@request.auth.collectionName = "usuarios_admin"',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'lider',
          type: 'relation',
          collectionId: lideres.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'termo',
          type: 'relation',
          collectionId: termosCol.id,
          maxSelect: 1,
        },
        {
          name: 'versao_termo',
          type: 'number',
          onlyInt: true,
        },
        {
          name: 'acao',
          type: 'select',
          required: true,
          values: ['aceite', 'recusa', 'revogacao'],
          maxSelect: 1,
        },
        {
          name: 'origem',
          type: 'select',
          required: true,
          values: ['portal', 'painel'],
          maxSelect: 1,
        },
        {
          name: 'registrado_por',
          type: 'text',
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
      indexes: ['CREATE INDEX idx_consentimentos_lider ON consentimentos (lider, created DESC)'],
    })
    app.save(consentimentos)
  },
  (app) => {
    try {
      const consentimentos = app.findCollectionByNameOrId('consentimentos')
      app.delete(consentimentos)
    } catch (_) {}

    try {
      const lideres = app.findCollectionByNameOrId('lideres')
      app.delete(lideres)
    } catch (_) {}

    try {
      const configCol = app.findCollectionByNameOrId('configuracoes_site')
      configCol.fields.removeByName('mensagem_convite')
      app.save(configCol)
    } catch (_) {}

    try {
      const parametrosCol = app.findCollectionByNameOrId('parametros')
      parametrosCol.fields.removeByName('dias_validade_convite')
      app.save(parametrosCol)
    } catch (_) {}

    try {
      const termosCol = app.findCollectionByNameOrId('termos')
      termosCol.removeIndex('idx_termos_tipo_versao_unique')
      termosCol.addIndex('idx_termos_tipo_versao', false, 'tipo, versao DESC', '')
      app.save(termosCol)
    } catch (_) {}
  },
)
