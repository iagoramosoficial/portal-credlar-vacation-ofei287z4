/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. configuracoes_site
    const configuracoesSite = new Collection({
      type: 'base',
      name: 'configuracoes_site',
      listRule: '', // Public read
      viewRule: '', // Public read
      createRule: null, // Superuser only
      updateRule: null, // Superuser only
      deleteRule: null, // Superuser only
      fields: [
        {
          name: 'nome_empresa',
          type: 'text',
          required: true,
        },
        {
          name: 'hero_linha_1',
          type: 'text',
          required: true,
        },
        {
          name: 'hero_destaque',
          type: 'text',
          required: true,
        },
        {
          name: 'hero_frase',
          type: 'text',
          required: true,
        },
        {
          name: 'rodape_parceria',
          type: 'text',
          required: true,
        },
        {
          name: 'rodape_metodologia',
          type: 'text',
          required: true,
        },
        {
          name: 'rodape_frase_1',
          type: 'text',
          required: true,
        },
        {
          name: 'rodape_frase_2',
          type: 'text',
          required: true,
        },
        {
          name: 'aviso_ativo',
          type: 'bool',
        },
        {
          name: 'aviso_texto',
          type: 'text',
        },
        {
          name: 'aviso_link',
          type: 'url',
        },
        {
          name: 'aviso_inicio',
          type: 'date',
        },
        {
          name: 'aviso_fim',
          type: 'date',
        },
      ],
    })
    app.save(configuracoesSite)

    // 2. cards_home
    const cardsHome = new Collection({
      type: 'base',
      name: 'cards_home',
      listRule: 'status = "publicado"', // Public read only published
      viewRule: 'status = "publicado"', // Public read only published
      createRule: null, // Superuser only
      updateRule: null, // Superuser only
      deleteRule: null, // Superuser only
      fields: [
        {
          name: 'titulo',
          type: 'text',
          required: true,
        },
        {
          name: 'descricao',
          type: 'text',
          required: true,
        },
        {
          name: 'icone',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['GraduationCap', 'MessageSquare', 'Folder', 'Calendar', 'Trophy', 'Heart'],
        },
        {
          name: 'selo_texto',
          type: 'text',
        },
        {
          name: 'selo_estilo',
          type: 'select',
          maxSelect: 1,
          values: ['amarelo', 'gradiente'],
        },
        {
          name: 'texto_botao',
          type: 'text',
          required: true,
        },
        {
          name: 'link',
          type: 'url',
        },
        {
          name: 'clicavel',
          type: 'bool',
        },
        {
          name: 'cor_icone',
          type: 'select',
          maxSelect: 1,
          values: ['padrao', 'dourado', 'lilas'],
        },
        {
          name: 'ordem',
          type: 'number',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['rascunho', 'publicado'],
        },
      ],
    })
    app.save(cardsHome)

    // 3. cliques
    const cliques = new Collection({
      type: 'base',
      name: 'cliques',
      listRule: null, // Superuser only
      viewRule: null, // Superuser only
      createRule: '', // Public create
      updateRule: null, // Superuser only
      deleteRule: null, // Superuser only
      fields: [
        {
          name: 'alvo',
          type: 'text',
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['card', 'link_curto'],
        },
      ],
    })
    app.save(cliques)

    // 4. historico
    const historico = new Collection({
      type: 'base',
      name: 'historico',
      listRule: null, // Superuser only
      viewRule: null, // Superuser only
      createRule: null, // Superuser only
      updateRule: null, // Superuser only
      deleteRule: null, // Superuser only
      fields: [
        {
          name: 'colecao',
          type: 'text',
          required: true,
        },
        {
          name: 'registro_id',
          type: 'text',
          required: true,
        },
        {
          name: 'acao',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['criar', 'editar', 'excluir'],
        },
        {
          name: 'usuario',
          type: 'text',
          required: true,
        },
        {
          name: 'antes',
          type: 'json',
        },
        {
          name: 'depois',
          type: 'json',
        },
      ],
    })
    app.save(historico)
  },
  (app) => {
    const collections = ['historico', 'cliques', 'cards_home', 'configuracoes_site']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch {
        // Ignora se não existir
      }
    }
  },
)
