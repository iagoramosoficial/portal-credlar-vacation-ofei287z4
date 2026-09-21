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
    data: Partial<ConfiguracoesSite>,
  ): Promise<ConfiguracoesSite & { id: string }> {
    const updated = await pb
      .collection('configuracoes_site')
      .update<ConfiguracoesSite & { id: string }>(id, data)
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
}
