import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Share2,
  Calendar,
  Sparkles,
  Award,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminService, HallPublicoItem } from '@/services/adminService'
import { getUrlPublica, formatarFotoUrl } from '@/lib/conteudo-padrao'
import pb from '@/lib/pocketbase/client'
import credlarLogo from '@/assets/logo-vertical-negativo-branco-vacataion-28a59.png'

const CATEGORIAS_CONFIG: Record<
  string,
  { label: string; corBadge: string; icon: React.ElementType }
> = {
  destaque: {
    label: 'Destaque',
    corBadge: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
    icon: Sparkles,
  },
  tempo_de_casa: {
    label: 'Tempo de Casa',
    corBadge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Calendar,
  },
  reconhecimento: {
    label: 'Reconhecimento',
    corBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Award,
  },
  boas_vindas: {
    label: 'Boas-vindas',
    corBadge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Sparkles,
  },
}

export const HallDaFamaPage: React.FC = () => {
  const { config } = useConteudoSite()
  const [vigentes, setVigentes] = useState<HallPublicoItem[]>([])
  const [carregandoVigentes, setCarregandoVigentes] = useState(true)

  // Arquivo
  const [arquivo, setArquivo] = useState<HallPublicoItem[]>([])
  const [paginaArquivo, setPaginaArquivo] = useState(1)
  const [temMaisArquivo, setTemMaisArquivo] = useState(false)
  const [carregandoArquivo, setCarregandoArquivo] = useState(false)
  const [arquivoIniciado, setArquivoIniciado] = useState(false)

  // Estado de compartilhamento
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregarVigentes() {
      try {
        setCarregandoVigentes(true)
        const itens = await adminService.getHallPublico()
        if (ativo) {
          setVigentes(itens)
        }
      } catch {
        if (ativo) setVigentes([])
      } finally {
        if (ativo) setCarregandoVigentes(false)
      }
    }
    carregarVigentes()
    return () => {
      ativo = false
    }
  }, [])

  const carregarMaisArquivo = async (reset: boolean = false) => {
    try {
      setCarregandoArquivo(true)
      const nextPage = reset ? 1 : paginaArquivo + 1
      const res = await adminService.getHallArquivo(nextPage, 8)
      if (reset) {
        setArquivo(res.items)
      } else {
        setArquivo((prev) => [...prev, ...res.items])
      }
      setPaginaArquivo(nextPage)
      setTemMaisArquivo(nextPage < res.totalPages)
      setArquivoIniciado(true)
    } catch {
      setTemMaisArquivo(false)
    } finally {
      setCarregandoArquivo(false)
    }
  }

  // Obter link público para compartilhar
  const baseUrl = getUrlPublica(config?.url_publica)
  const hallUrl = `${baseUrl}/hall-da-fama`

  const handleCompartilharWhatsApp = (item: HallPublicoItem) => {
    const textoMsg = `Confira a homenagem para *${item.nome}* no Hall da Fama da ${config?.nome_empresa || 'UniCredlar'}!\n\n${hallUrl}`
    const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMsg)}`
    window.open(linkWhatsApp, '_blank', 'noopener,noreferrer')
  }

  // Logo da empresa
  let logoSrc = credlarLogo
  if (config?.id && config?.logo_principal) {
    logoSrc = pb.files.getURL(config, config.logo_principal)
  }

  const tituloPagina = config?.hall_titulo || 'Hall da Fama'
  const subtituloPagina =
    config?.hall_subtitulo ||
    'Celebrando aqueles que constroem nossa história com dedicação, talento e resultados extraordinários.'

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

      {/* Hero do Hall */}
      <section className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-brand-light pt-14 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Trophy className="w-4 h-4 text-brand-gold" />
            Reconhecimento & Legado
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {tituloPagina}
          </h1>
          {subtituloPagina && (
            <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {subtituloPagina}
            </p>
          )}
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto px-4 -mt-10 mb-20 max-w-6xl relative z-20">
        {carregandoVigentes ? (
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            <p className="text-sm font-medium">Carregando homenagens...</p>
          </div>
        ) : vigentes.length === 0 ? (
          /* Estado vazio elegante */
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-12 md:p-16 text-center max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center mx-auto text-brand-gold shadow-inner">
              <Trophy className="w-8 h-8 text-brand-gold" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Novas homenagens em breve
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Nosso time está preparando as próximas histórias de destaque e dedicação. Em breve,
              novos líderes e colaboradores serão reconhecidos aqui!
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
          /* Grid de Homenagens Vigentes */
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-gold" />
                <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                  Homenageados em Destaque
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {vigentes.length} {vigentes.length === 1 ? 'homenagem' : 'homenagens'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {vigentes.map((item) => {
                const cat = CATEGORIAS_CONFIG[item.categoria] || {
                  label: item.categoria,
                  corBadge: 'bg-neutral-100 text-neutral-700 border-neutral-300',
                  icon: Award,
                }
                const CatIcon = cat.icon
                const fotoUrl = formatarFotoUrl(item.foto_url, pb.baseUrl)

                return (
                  <article
                    key={item.id}
                    className="bg-white rounded-2xl shadow-subtle hover:shadow-elevation transition-all duration-300 border border-neutral-200/90 flex flex-col overflow-hidden group"
                  >
                    {/* Header do Card com Foto e Dados */}
                    <div className="p-6 sm:p-7 flex gap-4 sm:gap-5 items-start bg-gradient-to-br from-neutral-50/50 to-white border-b border-neutral-100">
                      <div className="relative shrink-0">
                        {fotoUrl ? (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[3px] bg-gradient-to-tr from-brand-gold via-amber-400 to-yellow-200 shadow-md">
                            <img
                              src={fotoUrl}
                              alt={item.nome}
                              className="w-full h-full object-cover rounded-xl bg-neutral-100"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shadow-inner">
                            <Trophy className="w-10 h-10 text-brand-gold/60" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-neutral-950 font-bold text-xs shadow">
                          ★
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cat.corBadge}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {cat.label}
                          </span>
                          {item.periodo && (
                            <span className="text-xs text-neutral-500 font-medium">
                              • {item.periodo}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
                          {item.nome}
                        </h3>

                        {item.area && (
                          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                            {item.area}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Corpo com Título e Motivo */}
                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {item.titulo && (
                          <h4 className="text-base font-bold text-neutral-800">{item.titulo}</h4>
                        )}
                        <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line">
                          {item.motivo}
                        </p>
                      </div>

                      {/* Ação de Compartilhar */}
                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-brand-gold" />
                          Orgulho UniCredlar
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompartilharWhatsApp(item)}
                          className="border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* Seção: Homenageados Anteriores (Arquivo Carregado sob Demanda) */}
        <div className="mt-20 pt-10 border-t border-neutral-200/80 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                Homenageados Anteriores
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Consulte o arquivo de homenagens e celebrações passadas.
              </p>
            </div>

            {!arquivoIniciado && (
              <Button
                variant="outline"
                onClick={() => carregarMaisArquivo(true)}
                disabled={carregandoArquivo}
                className="border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold gap-2 self-start sm:self-auto"
              >
                {carregandoArquivo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
                Carregar Arquivo
              </Button>
            )}
          </div>

          {arquivoIniciado && (
            <>
              {arquivo.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  Nenhuma homenagem anterior arquivada até o momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {arquivo.map((item) => {
                    const cat = CATEGORIAS_CONFIG[item.categoria] || {
                      label: item.categoria,
                      corBadge: 'bg-neutral-100 text-neutral-700 border-neutral-300',
                      icon: Award,
                    }
                    const fotoUrl = formatarFotoUrl(item.foto_url, pb.baseUrl)

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-subtle transition-shadow"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={item.nome}
                                className="w-12 h-12 rounded-xl object-cover border border-neutral-200 bg-neutral-100 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                                <Trophy className="w-6 h-6 text-neutral-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 ${cat.corBadge}`}
                              >
                                {cat.label}
                              </span>
                              <h4 className="font-bold text-neutral-900 text-sm truncate">
                                {item.nome}
                              </h4>
                              {item.area && (
                                <p className="text-xs text-neutral-500 truncate">{item.area}</p>
                              )}
                            </div>
                          </div>

                          {item.titulo && (
                            <h5 className="font-semibold text-neutral-800 text-xs">
                              {item.titulo}
                            </h5>
                          )}
                          <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                            {item.motivo}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                          <span>{item.periodo || 'Anterior'}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCompartilharWhatsApp(item)}
                            className="h-7 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-[11px] gap-1"
                          >
                            <Share2 className="w-3 h-3" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {temMaisArquivo && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => carregarMaisArquivo(false)}
                    disabled={carregandoArquivo}
                    className="border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold gap-2"
                  >
                    {carregandoArquivo ? (
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    )}
                    Ver Mais Anteriores
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Rodapé institucional */}
      <Footer config={config} />
    </div>
  )
}
export default HallDaFamaPage
