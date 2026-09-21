/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Seed configuracoes_site
    const configCol = app.findCollectionByNameOrId('configuracoes_site')
    const configRecord = new Record(configCol)

    configRecord.set('nome_empresa', 'Credlar Vacation')
    configRecord.set('hero_linha_1', 'Bem-vindo ao')
    configRecord.set('hero_destaque', 'Ecossistema Credlar')
    configRecord.set('hero_frase', 'Seu veículo para a realização dos seus sonhos')
    configRecord.set('rodape_parceria', 'Em parceria estratégica com XDreams Advisory')
    configRecord.set('rodape_metodologia', 'Governança e Metodologia LPP')
    configRecord.set(
      'rodape_frase_1',
      'A Credlar Vacation é o veículo para a realização dos seus sonhos.',
    )
    configRecord.set('rodape_frase_2', 'Mas é você quem está no volante.')
    configRecord.set('aviso_ativo', false)
    configRecord.set('aviso_texto', '')
    configRecord.set('aviso_link', '')

    app.save(configRecord)

    // 2. Seed cards_home
    const cardsCol = app.findCollectionByNameOrId('cards_home')

    const seedCards = [
      {
        titulo: 'Plataforma UniCredlar',
        descricao:
          'Sua universidade corporativa. Acesse todos os cursos e trilhas de desenvolvimento preparadas para o seu crescimento profissional.',
        icone: 'GraduationCap',
        selo_texto: 'Em Breve — Gravações a partir de Novembro/2026',
        selo_estilo: 'amarelo',
        texto_botao: 'Aguarde',
        link: '',
        clicavel: false,
        cor_icone: 'padrao',
        ordem: 1,
        status: 'publicado',
      },
      {
        titulo: 'Deixe sua Sugestão',
        descricao:
          'Sua voz constrói o nosso futuro. Compartilhe suas ideias, críticas construtivas e sugestões de melhoria para o ecossistema.',
        icone: 'MessageSquare',
        selo_texto: '',
        selo_estilo: '',
        texto_botao: 'Enviar Sugestão',
        link: 'https://docs.google.com/forms/d/e/1FAIpQLSdwEWQEAoIUzO1zob8qZXOoZ5SDPuLMWTFHO0gVxGsseiwylg/viewform?usp=publish-editor',
        clicavel: true,
        cor_icone: 'padrao',
        ordem: 2,
        status: 'publicado',
      },
      {
        titulo: 'Materiais do Evento',
        descricao:
          'Acesse apostilas, slides e conteúdos exclusivos apresentados no Credlar Summit para revisar sempre que precisar.',
        icone: 'Folder',
        selo_texto: '',
        selo_estilo: '',
        texto_botao: 'Acessar Drive',
        link: 'https://drive.google.com/drive/folders/1OyUlcav-47Hyl7ZIGcZkywCTxDN5hXDU?usp=sharing',
        clicavel: true,
        cor_icone: 'padrao',
        ordem: 3,
        status: 'publicado',
      },
      {
        titulo: 'Calendário UniCredlar',
        descricao:
          'Fique por dentro dos próximos encontros, terapias em grupo, workshops e eventos corporativos.',
        icone: 'Calendar',
        selo_texto: 'Em Breve',
        selo_estilo: 'gradiente',
        texto_botao: 'Aguarde',
        link: '',
        clicavel: false,
        cor_icone: 'padrao',
        ordem: 4,
        status: 'publicado',
      },
      {
        titulo: 'Hall da Fama',
        descricao:
          'Reconhecimento àqueles que estão construindo um legado de excelência e resultados incríveis na Credlar.',
        icone: 'Trophy',
        selo_texto: 'Em Breve',
        selo_estilo: 'gradiente',
        texto_botao: 'Aguarde',
        link: '',
        clicavel: false,
        cor_icone: 'dourado',
        ordem: 5,
        status: 'publicado',
      },
      {
        titulo: 'CANAL DHX ESTRATÉGICO',
        descricao:
          'Apoio emocional, orientação de carreira e mentoria corporativa voltada para o seu bem-estar completo.',
        icone: 'Heart',
        selo_texto: '',
        selo_estilo: '',
        texto_botao: 'Falar com a Mari',
        link: 'https://docs.google.com/forms/d/e/1FAIpQLSfI8_L3B74gImXWv5OvIn-zcf312inkDEVe-fBnVp-kP25KkA/viewform?usp=publish-editor',
        clicavel: true,
        cor_icone: 'lilas',
        ordem: 6,
        status: 'publicado',
      },
    ]

    for (const card of seedCards) {
      const cardRecord = new Record(cardsCol)
      cardRecord.set('titulo', card.titulo)
      cardRecord.set('descricao', card.descricao)
      cardRecord.set('icone', card.icone)
      cardRecord.set('selo_texto', card.selo_texto)
      if (card.selo_estilo) {
        cardRecord.set('selo_estilo', card.selo_estilo)
      }
      cardRecord.set('texto_botao', card.texto_botao)
      if (card.link) {
        cardRecord.set('link', card.link)
      }
      cardRecord.set('clicavel', card.clicavel)
      cardRecord.set('cor_icone', card.cor_icone)
      cardRecord.set('ordem', card.ordem)
      cardRecord.set('status', card.status)

      app.save(cardRecord)
    }
  },
  (app) => {
    // Rollback seeds if needed
    try {
      app.db().newQuery('DELETE FROM cards_home').execute()
      app.db().newQuery('DELETE FROM configuracoes_site').execute()
    } catch {
      // silent
    }
  },
)
