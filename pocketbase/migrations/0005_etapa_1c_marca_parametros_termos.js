migrate(
  (app) => {
    // 1. Novos campos em configuracoes_site
    const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')

    if (!configuracoesSite.fields.getByName('logo_principal')) {
      configuracoesSite.fields.add(
        new FileField({
          name: 'logo_principal',
          maxSelect: 1,
          maxSize: 2097152, // 2 MB
          mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'],
        }),
      )
    }

    if (!configuracoesSite.fields.getByName('logo_secundario')) {
      configuracoesSite.fields.add(
        new FileField({
          name: 'logo_secundario',
          maxSelect: 1,
          maxSize: 2097152, // 2 MB
          mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'],
        }),
      )
    }

    if (!configuracoesSite.fields.getByName('titulo_pagina')) {
      configuracoesSite.fields.add(
        new TextField({
          name: 'titulo_pagina',
        }),
      )
    }

    if (!configuracoesSite.fields.getByName('fuso_horario')) {
      configuracoesSite.fields.add(
        new TextField({
          name: 'fuso_horario',
        }),
      )
    }

    if (!configuracoesSite.fields.getByName('cor_primaria')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_primaria' }))
    }
    if (!configuracoesSite.fields.getByName('cor_secundaria')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_secundaria' }))
    }
    if (!configuracoesSite.fields.getByName('cor_destaque')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_destaque' }))
    }
    if (!configuracoesSite.fields.getByName('cor_lilas')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_lilas' }))
    }
    if (!configuracoesSite.fields.getByName('cor_dourado')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_dourado' }))
    }
    if (!configuracoesSite.fields.getByName('cor_fundo_escuro')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_fundo_escuro' }))
    }
    if (!configuracoesSite.fields.getByName('cor_fundo_gradiente')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_fundo_gradiente' }))
    }
    if (!configuracoesSite.fields.getByName('cor_fundo_claro')) {
      configuracoesSite.fields.add(new TextField({ name: 'cor_fundo_claro' }))
    }

    app.save(configuracoesSite)

    // Atualizar seed nos registros existentes de configuracoes_site
    try {
      const records = app.findRecordsByFilter('configuracoes_site', '', '', 10, 0)
      for (const rec of records) {
        if (!rec.getString('titulo_pagina')) rec.set('titulo_pagina', 'Credlar Vacation')
        if (!rec.getString('fuso_horario')) rec.set('fuso_horario', 'America/Sao_Paulo')
        if (!rec.getString('cor_primaria')) rec.set('cor_primaria', '#CC1F1F')
        if (!rec.getString('cor_secundaria')) rec.set('cor_secundaria', '#E85C1A')
        if (!rec.getString('cor_destaque')) rec.set('cor_destaque', '#F5A623')
        if (!rec.getString('cor_lilas')) rec.set('cor_lilas', '#9B5FC0')
        if (!rec.getString('cor_dourado')) rec.set('cor_dourado', '#FFD700')
        if (!rec.getString('cor_fundo_escuro')) rec.set('cor_fundo_escuro', '#0A0A0A')
        if (!rec.getString('cor_fundo_gradiente')) rec.set('cor_fundo_gradiente', '#8B0000')
        if (!rec.getString('cor_fundo_claro')) rec.set('cor_fundo_claro', '#FAFAFA')
        app.save(rec)
      }
    } catch (_) {}

    // 2. Nova coleção parametros (registro único)
    // Regras: leitura e edição somente usuarios_admin com papel "admin"; criação e exclusão somente superusuário.
    const parametros = new Collection({
      type: 'base',
      name: 'parametros',
      listRule: '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"',
      viewRule: '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"',
      createRule: null, // superusuário somente
      updateRule:
        '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"',
      deleteRule: null, // superusuário somente
      fields: [
        {
          name: 'dias_alerta_sugestao',
          type: 'number',
          onlyInt: true,
        },
        {
          name: 'dias_pesquisa_aberta',
          type: 'number',
          onlyInt: true,
        },
        {
          name: 'dias_validade_homenagem',
          type: 'number',
          onlyInt: true,
        },
        {
          name: 'email_remetente_nome',
          type: 'text',
        },
        {
          name: 'email_remetente',
          type: 'email',
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
    })
    app.save(parametros)

    // Seed de parametros (registro único inicial)
    try {
      const existing = app.findRecordsByFilter('parametros', '', '', 1, 0)
      if (!existing || existing.length === 0) {
        const paramRecord = new Record(parametros)
        paramRecord.set('dias_alerta_sugestao', 7)
        paramRecord.set('dias_pesquisa_aberta', 7)
        paramRecord.set('dias_validade_homenagem', 30)
        paramRecord.set('email_remetente_nome', '')
        paramRecord.set('email_remetente', '')
        app.save(paramRecord)
      }
    } catch (_) {}

    // 3. Nova coleção termos
    // Regras:
    // - Leitura pública somente de registros com vigente = true.
    // - usuarios_admin com papel "admin" leem todos e criam.
    // - Edição: somente o campo vigente pode ser alterado; titulo, conteudo, versao e tipo são imutáveis após a criação (@request.body.conteudo:isset = false etc.).
    // - Exclusão: somente superusuário.
    const termos = new Collection({
      type: 'base',
      name: 'termos',
      listRule:
        'vigente = true || (@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin")',
      viewRule:
        'vigente = true || (@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin")',
      createRule:
        '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin"',
      updateRule:
        '@request.auth.collectionName = "usuarios_admin" && @request.auth.papel = "admin" && @request.body.tipo:isset = false && @request.body.versao:isset = false && @request.body.titulo:isset = false && @request.body.conteudo:isset = false',
      deleteRule: null, // superusuário somente
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['uso_imagem', 'privacidade'],
        },
        {
          name: 'versao',
          type: 'number',
          required: true,
          onlyInt: true,
        },
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'conteudo',
          type: 'editor',
        },
        {
          name: 'vigente',
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
        'CREATE INDEX idx_termos_tipo_versao ON termos (tipo, versao DESC)',
        'CREATE INDEX idx_termos_vigente ON termos (tipo, vigente)',
      ],
    })
    app.save(termos)
  },
  (app) => {
    try {
      const termos = app.findCollectionByNameOrId('termos')
      app.delete(termos)
    } catch (_) {}

    try {
      const parametros = app.findCollectionByNameOrId('parametros')
      app.delete(parametros)
    } catch (_) {}

    try {
      const configuracoesSite = app.findCollectionByNameOrId('configuracoes_site')
      const fieldsToRemove = [
        'logo_principal',
        'logo_secundario',
        'titulo_pagina',
        'fuso_horario',
        'cor_primaria',
        'cor_secundaria',
        'cor_destaque',
        'cor_lilas',
        'cor_dourado',
        'cor_fundo_escuro',
        'cor_fundo_gradiente',
        'cor_fundo_claro',
      ]
      for (const f of fieldsToRemove) {
        try {
          configuracoesSite.fields.removeByName(f)
        } catch (_) {}
      }
      app.save(configuracoesSite)
    } catch (_) {}
  },
)
