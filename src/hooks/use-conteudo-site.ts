import { useState, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'
import {
  ConfiguracoesSite,
  CardHome,
  CONFIGURACOES_PADRAO,
  CARDS_PADRAO,
} from '@/lib/conteudo-padrao'
import { aplicarCoresCss } from '@/lib/theme'
import { setAppTimezone } from '@/lib/timezone'

export function useConteudoSite() {
  const [config, setConfig] = useState<ConfiguracoesSite>(CONFIGURACOES_PADRAO)
  const [cards, setCards] = useState<CardHome[]>(CARDS_PADRAO)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function carregarDados() {
      try {
        // Busca paralela de configurações e cards
        const [configRes, cardsRes] = await Promise.allSettled([
          pb.collection('configuracoes_site').getFirstListItem<ConfiguracoesSite>(''),
          pb.collection('cards_home').getFullList<CardHome>({
            filter: 'status = "publicado"',
            sort: 'ordem',
          }),
        ])

        if (!isMounted) return

        if (configRes.status === 'fulfilled' && configRes.value) {
          const dadosConfig = configRes.value
          setConfig((prev) => ({
            ...prev,
            ...dadosConfig,
          }))

          // Aplicar cores dinâmicas
          aplicarCoresCss(dadosConfig)

          // Atualizar fuso horário centralizado
          if (dadosConfig.fuso_horario) {
            setAppTimezone(dadosConfig.fuso_horario)
          }

          // Atualizar título da aba do navegador
          if (dadosConfig.titulo_pagina) {
            document.title = dadosConfig.titulo_pagina
          }
        } else {
          // Fallback para valores padrão
          aplicarCoresCss(CONFIGURACOES_PADRAO)
          if (CONFIGURACOES_PADRAO.titulo_pagina) {
            document.title = CONFIGURACOES_PADRAO.titulo_pagina
          }
        }

        if (cardsRes.status === 'fulfilled' && cardsRes.value && cardsRes.value.length > 0) {
          // Ordenar pelo campo ordem
          const sorted = [...cardsRes.value].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
          setCards(sorted)
        }
      } catch {
        // Em caso de qualquer falha na requisição, o fallback já está no state
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    carregarDados()

    return () => {
      isMounted = false
    }
  }, [])

  return { config, cards, isLoading }
}

export function registrarClique(alvoId: string, tipo: 'card' | 'link_curto' = 'card') {
  // Chamada assíncrona desacoplada (não aguardada / sem bloquear o usuário)
  try {
    pb.collection('cliques')
      .create({
        alvo: alvoId,
        tipo,
      })
      .catch(() => {
        // Silencioso se falhar gravação de telemetria
      })
  } catch {
    // Silencioso
  }
}
