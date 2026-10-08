import { useEffect, useState, useMemo } from 'react'
import { Hero } from '@/components/Hero'
import { FeatureGrid } from '@/components/FeatureGrid'
import { Footer } from '@/components/Footer'
import { FaixaAviso } from '@/components/FaixaAviso'
import { FaixaDestaqueHall } from '@/components/FaixaDestaqueHall'
import { FaixaContagemEvento } from '@/components/FaixaContagemEvento'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { adminService, EventoItem, HallPublicoItem } from '@/services/adminService'
import { estaNoPeriodoAviso } from '@/lib/timezone'

export default function Index() {
  const { config, cards } = useConteudoSite()

  const [eventoDestaque, setEventoDestaque] = useState<EventoItem | null>(null)
  const [hallDestaques, setHallDestaques] = useState<HallPublicoItem[]>([])

  // Carregar dados de evento em destaque e Hall da Fama
  useEffect(() => {
    let ativo = true

    async function carregarDestaques() {
      try {
        const [eventosRes, hallRes] = await Promise.allSettled([
          adminService.getEventosPublicados(),
          adminService.getHallPublico(),
        ])

        if (!ativo) return

        if (eventosRes.status === 'fulfilled') {
          const agora = Date.now()
          // Encontrar evento publicado com destaque_home cuja data_hora_fim ou data_hora_inicio não passou
          const comDestaque = eventosRes.value
            .filter((ev) => ev.destaque_home)
            .filter((ev) => {
              const refStr =
                ev.data_hora_fim && ev.data_hora_fim.trim() ? ev.data_hora_fim : ev.data_hora_inicio
              const refMs = new Date(refStr).getTime()
              return isNaN(refMs) || refMs >= agora - 4 * 60 * 60 * 1000 // tolerância se estiver acontecendo hoje
            })
            .sort(
              (a, b) =>
                new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime(),
            )

          setEventoDestaque(comDestaque[0] || null)
        }

        if (hallRes.status === 'fulfilled') {
          const comDestaqueHall = hallRes.value.filter((h) => h.destaque_home)
          setHallDestaques(comDestaqueHall)
        }
      } catch {
        // Silencioso
      }
    }

    carregarDestaques()

    return () => {
      ativo = false
    }
  }, [])

  // Gerenciamento de Prioridades de Faixas (Máximo de 2 faixas visíveis):
  // Prioridade 1: Contagem Regressiva do Evento em Destaque (FaixaContagemEvento)
  // Prioridade 2: Faixa Destaque do Hall da Fama (FaixaDestaqueHall)
  // Prioridade 3: Faixa de Aviso Institucional (FaixaAviso)
  const temEventoDestaque = !!eventoDestaque
  const temHallDestaque = hallDestaques.length > 0
  const avisoConfigAtivo = useMemo(() => {
    if (!config?.aviso_texto?.trim()) return false
    return estaNoPeriodoAviso(config.aviso_ativo, config.aviso_inicio, config.aviso_fim)
  }, [config?.aviso_ativo, config?.aviso_texto, config?.aviso_inicio, config?.aviso_fim])

  // Seleção de no máximo duas faixas simultâneas:
  let exibirContagemEvento = false
  let exibirHall = false
  let exibirAviso = false

  let slotsDisponiveis = 2

  if (temEventoDestaque && slotsDisponiveis > 0) {
    exibirContagemEvento = true
    slotsDisponiveis--
  }

  if (avisoConfigAtivo && slotsDisponiveis > 0) {
    exibirAviso = true
    slotsDisponiveis--
  }

  // Hall em destaque é seção integrada de encerramento da página inicial (antes do rodapé)
  exibirHall = temHallDestaque

  return (
    <div className="w-full flex flex-col bg-brand-light min-h-screen font-sans overflow-x-hidden selection:bg-brand-red selection:text-white">
      {/* Faixas superiores (máximo 2 simultâneas por prioridade) */}
      {exibirAviso && <FaixaAviso config={config} />}
      {exibirContagemEvento && eventoDestaque && <FaixaContagemEvento evento={eventoDestaque} />}

      <Hero config={config} />

      <FeatureGrid cards={cards} />

      {/* Seção de encerramento: Destaque do Hall da Fama (integrado à Home, antes do rodapé) */}
      {exibirHall && <FaixaDestaqueHall />}

      <Footer config={config} />
    </div>
  )
}
