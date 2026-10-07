import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, ChevronRight, Sparkles } from 'lucide-react'
import { adminService, HallPublicoItem } from '@/services/adminService'
import pb from '@/lib/pocketbase/client'

const CATEGORIA_LABELS: Record<string, string> = {
  destaque: 'Destaque',
  tempo_de_casa: 'Tempo de Casa',
  reconhecimento: 'Reconhecimento',
  boas_vindas: 'Boas-vindas',
}

export const FaixaDestaqueHall: React.FC = () => {
  const [destaques, setDestaques] = useState<HallPublicoItem[]>([])
  const [indiceAtual, setIndiceAtual] = useState(0)

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

  // Alternar entre destaques a cada 8 segundos se houver mais de um
  useEffect(() => {
    if (destaques.length <= 1) return

    const interval = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % destaques.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [destaques.length])

  // Se não houver nenhum homenageado com destaque_home, a faixa simplesmente não aparece
  if (destaques.length === 0) {
    return null
  }

  const homenageado = destaques[indiceAtual] || destaques[0]
  if (!homenageado) return null

  // Pegar a primeira linha do motivo
  const primeiraLinhaMotivo = homenageado.motivo
    ? homenageado.motivo
        .split('\n')[0]
        .replace(/<[^>]*>?/gm, '')
        .trim()
    : ''

  const fotoUrl = homenageado.foto_url || ''

  return (
    <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-y border-brand-gold/25 py-3.5 px-4 shadow-inner relative overflow-hidden transition-all duration-500">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 relative z-10">
        <Link
          to="/hall-da-fama"
          className="flex items-center gap-3.5 group flex-1 min-w-0 w-full sm:w-auto"
        >
          {/* Badge ou Ícone de Troféu */}
          <div className="relative shrink-0">
            {fotoUrl ? (
              <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-brand-gold via-amber-400 to-yellow-200 shadow-md">
                <img
                  src={fotoUrl}
                  alt={homenageado.nome}
                  className="w-full h-full object-cover rounded-full bg-neutral-800"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-gold/30 to-amber-500/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold shadow-sm">
                <Trophy className="w-5 h-5 text-brand-gold" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[9px] text-neutral-950 font-bold">
              ★
            </span>
          </div>

          {/* Texto do Homenageado */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                {CATEGORIA_LABELS[homenageado.categoria] || 'Hall da Fama'}
              </span>
              <span className="text-white font-bold text-sm truncate group-hover:text-brand-gold transition-colors">
                {homenageado.nome}
              </span>
              {homenageado.area && (
                <span className="text-xs text-neutral-400 hidden md:inline truncate">
                  • {homenageado.area}
                </span>
              )}
              {homenageado.periodo && (
                <span className="text-xs text-neutral-500 hidden lg:inline">
                  ({homenageado.periodo})
                </span>
              )}
            </div>
            {primeiraLinhaMotivo && (
              <p className="text-xs text-neutral-300 truncate mt-0.5 max-w-2xl font-light">
                {primeiraLinhaMotivo}
              </p>
            )}
          </div>
        </Link>

        {/* Botão de Link para o Hall */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {destaques.length > 1 && (
            <div className="flex items-center gap-1 mr-1 hidden sm:flex">
              {destaques.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndiceAtual(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === indiceAtual
                      ? 'bg-brand-gold w-4'
                      : 'bg-neutral-700 hover:bg-neutral-500'
                  }`}
                  aria-label={`Ver destaque ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <Link
            to="/hall-da-fama"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-950 bg-gradient-to-r from-brand-gold via-amber-300 to-yellow-400 hover:opacity-95 shadow-sm transition transform active:scale-95"
          >
            <span>Ver Homenagens</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
