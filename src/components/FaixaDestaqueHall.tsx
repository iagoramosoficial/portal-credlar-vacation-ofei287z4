import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, ChevronRight } from 'lucide-react'
import { adminService, HallPublicoItem } from '@/services/adminService'
import { formatarFotoUrl } from '@/lib/conteudo-padrao'
import pb from '@/lib/pocketbase/client'

export const FaixaDestaqueHall: React.FC = () => {
  const [destaques, setDestaques] = useState<HallPublicoItem[]>([])
  const [grupoAtual, setGrupoAtual] = useState(0)

  useEffect(() => {
    let ativo = true
    const carregarDestaques = async () => {
      try {
        const publicos = await adminService.getHallPublico()
        if (ativo) {
          const comDestaque = publicos.filter((h) => h.destaque_home)
          setDestaques(comDestaque)
        }
      } catch {
        if (ativo) setDestaques([])
      }
    }

    carregarDestaques()
    return () => {
      ativo = false
    }
  }, [])

  // Agrupar homenageados de 3 em 3 para rotação
  const GRUPO_TAMANHO = 3
  const grupos = useMemo(() => {
    const list: HallPublicoItem[][] = []
    for (let i = 0; i < destaques.length; i += GRUPO_TAMANHO) {
      list.push(destaques.slice(i, i + GRUPO_TAMANHO))
    }
    return list
  }, [destaques])

  // Rotacionar conjuntos a cada 4 segundos se houver mais de 3 homenageados,
  // respeitando a preferência prefers-reduced-motion do sistema operacional/usuário.
  useEffect(() => {
    if (grupos.length <= 1) return

    // Verificar se o usuário prefere redução de movimento
    const mediaQuery =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null

    if (mediaQuery && mediaQuery.matches) {
      return
    }

    const interval = setInterval(() => {
      setGrupoAtual((prev) => (prev + 1) % grupos.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [grupos.length])

  // Se não houver nenhum homenageado com destaque_home, o bloco não aparece
  if (destaques.length === 0) {
    return null
  }

  const grupoVisivel = grupos[grupoAtual] || grupos[0] || []

  return (
    <section className="w-full bg-brand-light py-16 md:py-24 border-t border-neutral-200/60 relative z-10 transition-colors">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Cabeçalho sutil e integrado da seção */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Reconhecimento
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Destaques do Hall da Fama
          </h2>
          <div className="w-12 h-0.5 bg-neutral-300 mx-auto mt-2" />
        </div>

        {/* Grade de homenageados: até três lado a lado no desktop, empilhados no mobile */}
        <div
          className={`grid grid-cols-1 ${
            grupoVisivel.length === 1
              ? 'max-w-md mx-auto'
              : grupoVisivel.length === 2
                ? 'md:grid-cols-2 max-w-3xl mx-auto gap-6 md:gap-8'
                : 'md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'
          }`}
        >
          {grupoVisivel.map((homenageado) => {
            const fotoUrl = formatarFotoUrl(homenageado.foto_url, pb.baseUrl)
            const primeiraLinhaMotivo = homenageado.motivo
              ? homenageado.motivo
                  .split('\n')[0]
                  .replace(/<[^>]*>?/gm, '')
                  .trim()
              : ''

            return (
              <div
                key={homenageado.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-6 md:p-7 shadow-subtle hover:shadow-elevation transition-all duration-300 flex flex-col items-center text-center space-y-4 relative group"
              >
                {/* Foto circular do homenageado em destaque com borda sutil */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-neutral-100 border border-neutral-200/90 shadow-sm group-hover:border-neutral-300 transition-colors">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={homenageado.nome}
                        className="w-full h-full object-cover rounded-full bg-neutral-100"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <Trophy className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  {/* Detalhe fino se necessário, discreto */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-amber-500">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Informações: Nome com tipografia de título da home, área e período em texto secundário */}
                <div className="space-y-1.5 w-full min-w-0">
                  <h3 className="font-extrabold text-neutral-900 text-lg sm:text-xl uppercase tracking-wide leading-tight">
                    {homenageado.nome}
                  </h3>

                  {(homenageado.area || homenageado.periodo) && (
                    <p className="text-xs sm:text-sm text-neutral-500 font-normal">
                      {homenageado.area}
                      {homenageado.area && homenageado.periodo ? ' • ' : ''}
                      {homenageado.periodo && <span>{homenageado.periodo}</span>}
                    </p>
                  )}
                </div>

                {/* Linha do motivo */}
                {primeiraLinhaMotivo && (
                  <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed line-clamp-2 px-1">
                    "{primeiraLinhaMotivo}"
                  </p>
                )}

                {/* Chamada discreta "Ver no Hall da Fama" como LINK, não como botão chamativo */}
                <div className="pt-2 mt-auto">
                  <Link
                    to="/hall-da-fama"
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
                  >
                    <span>Ver no Hall da Fama</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicadores de rotação caso haja mais de 1 grupo (acima de 3 homenageados) */}
        {grupos.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {grupos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGrupoAtual(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === grupoAtual
                    ? 'w-6 bg-neutral-800'
                    : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Ver conjunto de homenageados ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
export default FaixaDestaqueHall
