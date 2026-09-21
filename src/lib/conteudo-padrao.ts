export interface ConfiguracoesSite {
  id?: string
  nome_empresa: string
  hero_linha_1: string
  hero_destaque: string
  hero_frase: string
  rodape_parceria: string
  rodape_metodologia: string
  rodape_frase_1: string
  rodape_frase_2: string
  aviso_ativo: boolean
  aviso_texto?: string
  aviso_link?: string
  aviso_inicio?: string
  aviso_fim?: string
}

export interface CardHome {
  id: string
  titulo: string
  descricao: string
  icone: 'GraduationCap' | 'MessageSquare' | 'Folder' | 'Calendar' | 'Trophy' | 'Heart'
  selo_texto?: string
  selo_estilo?: 'amarelo' | 'gradiente' | ''
  texto_botao: string
  link?: string
  clicavel: boolean
  cor_icone: 'padrao' | 'dourado' | 'lilas'
  ordem: number
  status: 'rascunho' | 'publicado'
}

export const CONFIGURACOES_PADRAO: ConfiguracoesSite = {
  nome_empresa: 'Credlar Vacation',
  hero_linha_1: 'Bem-vindo ao',
  hero_destaque: 'Ecossistema Credlar',
  hero_frase: 'Seu veículo para a realização dos seus sonhos',
  rodape_parceria: 'Em parceria estratégica com XDreams Advisory',
  rodape_metodologia: 'Governança e Metodologia LPP',
  rodape_frase_1: 'A Credlar Vacation é o veículo para a realização dos seus sonhos.',
  rodape_frase_2: 'Mas é você quem está no volante.',
  aviso_ativo: false,
  aviso_texto: '',
  aviso_link: '',
  aviso_inicio: '',
  aviso_fim: '',
}

export const CARDS_PADRAO: CardHome[] = [
  {
    id: 'padrao-1',
    titulo: 'Plataforma UniCredlar',
    descricao:
      'Sua universidade corporativa. Acesse todos os cursos e trilhas de desenvolvimento preparadas para o seu crescimento profissional.',
    icone: 'GraduationCap',
    selo_texto: 'Em Breve — Gravações a partir de Novembro/2026',
    selo_estilo: 'amarelo',
    texto_botao: 'Aguarde',
    link: '#',
    clicavel: false,
    cor_icone: 'padrao',
    ordem: 1,
    status: 'publicado',
  },
  {
    id: 'padrao-2',
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
    id: 'padrao-3',
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
    id: 'padrao-4',
    titulo: 'Calendário UniCredlar',
    descricao:
      'Fique por dentro dos próximos encontros, terapias em grupo, workshops e eventos corporativos.',
    icone: 'Calendar',
    selo_texto: 'Em Breve',
    selo_estilo: 'gradiente',
    texto_botao: 'Aguarde',
    link: '#',
    clicavel: false,
    cor_icone: 'padrao',
    ordem: 4,
    status: 'publicado',
  },
  {
    id: 'padrao-5',
    titulo: 'Hall da Fama',
    descricao:
      'Reconhecimento àqueles que estão construindo um legado de excelência e resultados incríveis na Credlar.',
    icone: 'Trophy',
    selo_texto: 'Em Breve',
    selo_estilo: 'gradiente',
    texto_botao: 'Aguarde',
    link: '#',
    clicavel: false,
    cor_icone: 'dourado',
    ordem: 5,
    status: 'publicado',
  },
  {
    id: 'padrao-6',
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
