import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ExternalLink,
  Camera,
  CalendarPlus,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { adminService, EventoItem } from '@/services/adminService'
import { formatarDataHora } from '@/lib/timezone'
import { baixarIcs } from '@/lib/ics'
import pb from '@/lib/pocketbase/client'
import credlarLogo from '@/assets/logo-vertical-negativo-branco-vacataion-28a59.png'

export const AgendaPage: React.FC = () => {
  const { config } = useConteudoSite()
  const [eventos, setEventos] = useState<EventoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregarEventos() {
      try {
        setCarregando(true)
        const lista = await adminService.getEventosPublicados()
        if (ativo) {
          setEventos(lista)
        }
      } catch {
        if (ativo) setEventos([])
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarEventos()
    return () => {
      ativo = false
    }
  }, [])

  // Separar em próximos eventos e eventos anteriores
  const agoraMs = Date.now()

  const proximosEventos = eventos.filter((ev) => {
    const dataFim = ev.data_hora_fim
    const dataInicio = ev.data_hora_inicio
    const refStr = dataFim && dataFim.trim() ? dataFim : dataInicio
    const refMs = new Date(refStr).getTime()
    return isNaN(refMs) || refMs >= agoraMs
  })

  const eventosAnteriores = eventos.filter((ev) => {
    const dataFim = ev.data_hora_fim
    const dataInicio = ev.data_hora_inicio
    const refStr = dataFim && dataFim.trim() ? dataFim : dataInicio
    const refMs = new Date(refStr).getTime()
    return !isNaN(refMs) && refMs < agoraMs
  })

  // Logo da empresa
  let logoSrc = credlarLogo
  if (config?.id && config?.logo_principal) {
    logoSrc = pb.files.getURL(config, config.logo_principal)
  }

  const handleAdicionarAgenda = (ev: EventoItem) => {
    baixarIcs({
      title: ev.titulo,
      description: ev.descricao,
      location: ev.local,
      startDate: ev.data_hora_inicio,
      endDate: ev.data_hora_fim,
      url: ev.link,
    })
  }

  return (
    <div className="w-full flex flex-col bg-brand-light min-h-screen font-sans selection:bg-brand-red selection:text-white">
      {/* Header Escuro */}
      <header className="bg-brand-dark text-white border-b border-white/10 sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs md:text-sm text-neutral-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-brand-orange group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao início</span>
          </Link>

          <Link to="/" className="h-8 flex items-center">
            <img
              src={logoSrc}
              alt={config?.nome_empresa || 'Credlar Vacation'}
              className="h-8 max-w-[140px] object-contain drop-shadow"
            />
          </Link>
        </div>
      </header>

      {/* Hero da Agenda com faixa escura bem definida */}
      <section className="bg-neutral-950 text-white border-b border-neutral-800/80 pt-12 pb-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-brand-orange/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-brand-orange text-xs font-bold uppercase tracking-wider shadow-sm">
            <CalendarIcon className="w-4 h-4 text-brand-orange" />
            Programação & Encontros
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Agenda de Eventos
          </h1>
          <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Acompanhe workshops, celebrações, treinamentos e encontros corporativos do ecossistema.
          </p>
        </div>
      </section>

      {/* Conteúdo Principal sobre fundo claro */}
      <main className="flex-1 container mx-auto px-4 py-10 mb-16 max-w-5xl relative z-20 space-y-12">
        {carregando ? (
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-16 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <Loader2 className="w-8 h-8 text-neutral-700 animate-spin" />
            <p className="text-sm font-medium">Carregando agenda...</p>
          </div>
        ) : proximosEventos.length === 0 ? (
          /* Estado vazio elegante */
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-12 md:p-16 text-center max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-700 shadow-inner">
              <CalendarIcon className="w-8 h-8 text-neutral-700" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Nenhum evento agendado no momento
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Nossa equipe está planejando as próximas atividades e encontros. Fique atento às
              novidades no portal!
            </p>
            <div className="pt-2">
              <Button
                asChild
                variant="outline"
                className="border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              >
                <Link to="/">Voltar à Página Inicial</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Lista cronológica de próximos eventos */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-neutral-800" />
                <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                  Próximos Eventos
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-xs">
                {proximosEventos.length}{' '}
                {proximosEventos.length === 1 ? 'evento programado' : 'eventos programados'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {proximosEventos.map((ev) => {
                const imagemUrl = ev.imagem ? pb.files.getURL(ev, ev.imagem) : null

                return (
                  <article
                    key={ev.id}
                    className="bg-white rounded-2xl shadow-subtle hover:shadow-elevation transition-all duration-300 border border-neutral-200/90 p-6 md:p-7 flex flex-col md:flex-row gap-6 items-start"
                  >
                    {/* Imagem quadrada se houver */}
                    {imagemUrl ? (
                      <div className="w-full md:w-44 md:h-44 aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                        <img
                          src={imagemUrl}
                          alt={ev.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="hidden md:flex w-44 h-44 rounded-xl bg-neutral-100 border border-neutral-200 flex-col items-center justify-center text-neutral-400 shrink-0 gap-2">
                        <CalendarIcon className="w-10 h-10 text-neutral-400" />
                        <span className="text-[11px] font-medium text-neutral-500">Credlar</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-3.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-neutral-700" />
                            {formatarDataHora(ev.data_hora_inicio)}
                            {ev.data_hora_fim && ` até ${formatarDataHora(ev.data_hora_fim)}`}
                          </span>

                          {ev.destaque_home && (
                            <span className="text-[11px] font-bold text-brand-orange bg-brand-orange/10 border border-brand-orange/30 px-2 py-0.5 rounded-full">
                              Destaque
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
                          {ev.titulo}
                        </h3>
                      </div>

                      {/* Local ou Link online */}
                      <div className="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
                        {ev.local && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span>{ev.local}</span>
                          </div>
                        )}

                        {ev.link && (
                          <a
                            href={ev.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-orange hover:underline font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Link do evento / Sala online
                          </a>
                        )}
                      </div>

                      {ev.descricao && (
                        <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line">
                          {ev.descricao}
                        </p>
                      )}

                      {/* Botão Adicionar à Agenda */}
                      <div className="pt-2 flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdicionarAgenda(ev)}
                          className="border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-neutral-700" />
                          Adicionar à agenda (.ics)
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* Seção: Eventos anteriores */}
        {eventosAnteriores.length > 0 && (
          <div className="pt-10 border-t border-neutral-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                  Eventos Anteriores
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Consulte os encontros realizados e veja as fotos dos momentos especiais.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarAnteriores(!mostrarAnteriores)}
                className="border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold gap-1.5 self-start sm:self-auto"
              >
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    mostrarAnteriores ? 'rotate-180' : ''
                  }`}
                />
                {mostrarAnteriores ? 'Ocultar Anteriores' : 'Ver Eventos Anteriores'} (
                {eventosAnteriores.length})
              </Button>
            </div>

            {mostrarAnteriores && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 animate-fade-in">
                {eventosAnteriores.map((ev) => {
                  const imagemUrl = ev.imagem ? pb.files.getURL(ev, ev.imagem) : null

                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-subtle transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {imagemUrl ? (
                            <img
                              src={imagemUrl}
                              alt={ev.titulo}
                              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                              <CalendarIcon className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="inline-block text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full mb-1">
                              {formatarDataHora(ev.data_hora_inicio)}
                            </span>
                            <h4 className="font-bold text-neutral-900 text-sm leading-snug">
                              {ev.titulo}
                            </h4>
                            {ev.local && (
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{ev.local}</p>
                            )}
                          </div>
                        </div>

                        {ev.descricao && (
                          <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                            {ev.descricao}
                          </p>
                        )}
                      </div>

                      {/* Botão Ver fotos se houver link_fotos */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400">Evento realizado</span>
                        {ev.link_fotos && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold gap-1.5 rounded-lg shadow-xs"
                          >
                            <a href={ev.link_fotos} target="_blank" rel="noopener noreferrer">
                              <Camera className="w-3.5 h-3.5 text-brand-orange" />
                              Ver fotos
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rodapé institucional */}
      <Footer config={config} />
    </div>
  )
}

export default AgendaPage
