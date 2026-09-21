import pb from '@/lib/pocketbase/client'
import { ConfiguracoesSite, CardHome } from '@/lib/conteudo-padrao'

export interface HistoricoItem {
  id: string
  colecao: string
  registro_id: string
  acao: 'criar' | 'editar' | 'excluir'
  usuario: string
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
  created: string
  updated: string
}

export interface ParametrosApp {
  id: string
  dias_alerta_sugestao: number
  dias_pesquisa_aberta: number
  dias_validade_homenagem: number
  email_remetente_nome?: string
  email_remetente?: string
  created: string
  updated: string
}

export interface TermoItem {
  id: string
  tipo: 'uso_imagem' | 'privacidade'
  versao: number
  titulo: string
  conteudo?: string
  vigente: boolean
  created: string
  updated: string
}

export interface CliqueItem {
  id: string
  alvo: string
  tipo: 'card' | 'link_curto'
  created: string
  updated: string
}

export const adminService = {
  // Configurações do site
  async getConfiguracoes(): Promise<ConfiguracoesSite & { id: string }> {
    const record = await pb
      .collection('configuracoes_site')
      .getFirstListItem<ConfiguracoesSite & { id: string }>('')
    return record
  },

  async updateConfiguracoes(
    id: string,
    data: Partial<ConfiguracoesSite> | FormData,
  ): Promise<ConfiguracoesSite & { id: string }> {
    const updated = await pb
      .collection('configuracoes_site')
      .update<ConfiguracoesSite & { id: string }>(id, data as Record<string, unknown>)
    return updated
  },

  // Cards Home
  async getCards(): Promise<CardHome[]> {
    const list = await pb.collection('cards_home').getFullList<CardHome>({
      sort: 'ordem',
    })
    return list
  },

  async createCard(data: Omit<CardHome, 'id'>): Promise<CardHome> {
    const created = await pb.collection('cards_home').create<CardHome>(data)
    return created
  },

  async updateCard(id: string, data: Partial<CardHome>): Promise<CardHome> {
    const updated = await pb.collection('cards_home').update<CardHome>(id, data)
    return updated
  },

  async deleteCard(id: string): Promise<boolean> {
    await pb.collection('cards_home').delete(id)
    return true
  },

  // Histórico
  async getHistorico(): Promise<HistoricoItem[]> {
    const list = await pb.collection('historico').getFullList<HistoricoItem>({
      sort: '-created',
    })
    return list
  },

  // Cliques
  async getCliques(): Promise<CliqueItem[]> {
    const list = await pb.collection('cliques').getFullList<CliqueItem>({
      sort: '-created',
    })
    return list
  },

  // Parâmetros (Admin)
  async getParametros(): Promise<ParametrosApp> {
    const record = await pb.collection('parametros').getFirstListItem<ParametrosApp>('')
    return record
  },

  async updateParametros(id: string, data: Partial<ParametrosApp>): Promise<ParametrosApp> {
    const updated = await pb.collection('parametros').update<ParametrosApp>(id, data)
    return updated
  },

  // Termos
  async getTermos(): Promise<TermoItem[]> {
    const list = await pb.collection('termos').getFullList<TermoItem>({
      sort: '-versao',
    })
    return list
  },

  async getTermoVigente(tipo: 'uso_imagem' | 'privacidade'): Promise<TermoItem | null> {
    try {
      const record = await pb
        .collection('termos')
        .getFirstListItem<TermoItem>(`tipo = "${tipo}" && vigente = true`)
      return record
    } catch {
      return null
    }
  },

  async createTermo(data: {
    tipo: 'uso_imagem' | 'privacidade'
    versao: number
    titulo: string
    conteudo?: string
    vigente?: boolean
  }): Promise<TermoItem> {
    const created = await pb.collection('termos').create<TermoItem>(data)
    return created
  },

  async setTermoVigente(id: string): Promise<TermoItem> {
    const updated = await pb.collection('termos').update<TermoItem>(id, { vigente: true })
    return updated
  },
}
