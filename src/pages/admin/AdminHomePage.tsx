import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  Globe,
  Layers,
  History,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Shield,
  Clock,
  Trophy,
  Users,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_TIMEZONE, formatarApenasData } from '@/lib/timezone'
import { adminService, LiderItem } from '@/services/adminService'

interface SugestaoAniversario {
  lider: LiderItem
  anos: number
  dataAniversario: string
  diasFaltando: number
}

export const AdminHomePage: React.FC = () => {
  const { usuario } = useAdminAuth()
  const [sugestoes, setSugestoes] = useState<SugestaoAniversario[]>([])
  const [loadingSugestoes, setLoadingSugestoes] = useState(true)

  // Alerta no painel (tela Início) quando um líder autorizado completar 1, 3, 5 ou 10 anos de casa nos próximos 15 dias
  useEffect(() => {
    async function calcularAniversarios() {
      try {
        setLoadingSugestoes(true)
        const lideres = await adminService.getLideres()
        const autorizados = lideres.filter((l) => l.status === 'autorizado' && l.data_admissao)

        // Calcular hoje no fuso configurado
        const hoje = new Date()
        const anoAtual = hoje.getFullYear()

        const proximos: SugestaoAniversario[] = []

        for (const lider of autorizados) {
          if (!lider.data_admissao) continue
          const dataAdm = new Date(lider.data_admissao)
          if (isNaN(dataAdm.getTime())) continue

          const anoAdm = dataAdm.getUTCFullYear()
          const mesAdm = dataAdm.getUTCMonth()
          const diaAdm = dataAdm.getUTCDate()

          // Marcos: 1, 3, 5 ou 10 anos de casa
          const marcos = [1, 3, 5, 10]

          for (const m of marcos) {
            const anoAlvo = anoAdm + m
            // Data do aniversário de empresa
            const dataMarco = new Date(anoAlvo, mesAdm, diaAdm)
            const diffMs = dataMarco.getTime() - hoje.getTime()
            const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

            // Se for acontecer nos próximos 15 dias (0 a 15)
            if (diffDias >= 0 && diffDias <= 15) {
              proximos.push({
                lider,
                anos: m,
                dataAniversario: dataMarco.toISOString(),
                diasFaltando: diffDias,
              })
            }
          }
        }

        setSugestoes(proximos)
      } catch {
        setSugestoes([])
      } finally {
        setLoadingSugestoes(false)
      }
    }

    calcularAniversarios()
  }, [])

  const atalhos = [
    {
      titulo: 'Hall da Fama',
      descricao:
        'Crie homenagens públicas para líderes autorizados por tempo de casa, conquistas e destaque corporativo.',
      path: '/admin/hall',
      icon: Trophy,
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-brand-gold',
      badge: 'Reconhecimento',
    },
    {
      titulo: 'Líderes & Consentimento',
      descricao:
        'Cadastre novos líderes, envie links de autorização de uso de imagem e acompanhe o status de consentimento.',
      path: '/admin/lideres',
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
      badge: 'LGPD & Time',
    },
    {
      titulo: 'Textos do Site',
      descricao:
        'Altere os textos do topo, chamadas do Hero, rodapé e a faixa de aviso (com datas de vigência em horário oficial).',
      path: '/admin/site',
      icon: Globe,
      color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-brand-orange',
      badge: 'Geral',
    },
    {
      titulo: 'Cards da Home',
      descricao:
        'Gerencie a vitrine de cards da página inicial: crie, edite textos, ícones, botões, ordene e alterne entre rascunho ou publicado.',
      path: '/admin/cards',
      icon: Layers,
      color: 'from-brand-red/20 to-orange-500/10 border-brand-red/30 text-brand-red',
      badge: 'Conteúdo',
    },
    {
      titulo: 'Histórico de Alterações',
      descricao:
        'Consulte todas as modificações feitas pela equipe, veja o que mudou antes e depois e exporte para planilha.',
      path: '/admin/historico',
      icon: History,
      color: 'from-purple-500/20 to-brand-lilac/10 border-purple-500/30 text-brand-lilac',
      badge: 'Auditoria',
    },
  ]

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Banner de Boas-vindas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-brand opacity-10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              <Sparkles className="w-3.5 h-3.5" />
              Painel de Gestão sem Código
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Olá, <span className="text-gradient-brand">{usuario?.nome}</span>!
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Bem-vindo ao painel administrativo da Credlar Vacation. Aqui você pode atualizar todos
              os conteúdos do portal, gerenciar cards, banners temporários e acompanhar o histórico
              de modificações.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-white transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              Abrir Site Público
            </a>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800/60 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            Fuso horário oficial:{' '}
            <strong className="text-neutral-300 font-medium">Brasília ({APP_TIMEZONE})</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-400" />
            Perfil ativo:{' '}
            <strong className="text-neutral-300 uppercase font-medium">{usuario?.papel}</strong>
          </span>
        </div>
      </div>

      {/* Alerta de Tempo de Casa Sugerindo Homenagem */}
      {sugestoes.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 md:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Sugestão de Homenagem por Tempo de Casa
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {sugestoes.length} {sugestoes.length === 1 ? 'alerta' : 'alertas'}
                </span>
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Líderes autorizados completando marcos de 1, 3, 5 ou 10 anos de casa nos próximos 15
                dias. Você pode criar uma homenagem comemorativa no Hall da Fama.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sugestoes.map((sug, idx) => {
              const nome = sug.lider.nome_exibicao || sug.lider.nome
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white truncate">{nome}</p>
                    <p className="text-[11px] text-amber-400 font-medium">
                      {sug.anos} {sug.anos === 1 ? 'ano' : 'anos'} de casa em{' '}
                      {sug.diasFaltando === 0 ? 'hoje' : `${sug.diasFaltando} dias`}
                    </p>
                    {sug.lider.area && (
                      <p className="text-[10px] text-neutral-500 truncate">{sug.lider.area}</p>
                    )}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs h-8 px-2.5 shrink-0"
                  >
                    <Link to="/admin/hall">Criar Homenagem</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid de Atalhos para Telas */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight mb-4">
          Atalhos de Gestão
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {atalhos.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group relative flex flex-col justify-between p-6 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all shadow-sm duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center border shadow-inner`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-orange transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed">{item.descricao}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs font-semibold text-neutral-400 group-hover:text-white transition">
                  <span>Acessar tela</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-brand-orange" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
