import React from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_TIMEZONE } from '@/lib/timezone'

export const AdminHomePage: React.FC = () => {
  const { usuario } = useAdminAuth()

  const atalhos = [
    {
      titulo: 'Textos do Site',
      descricao:
        'Altere os textos do topo, chamadas do Hero, rodapé e a faixa de aviso (com datas de vigência em horário de Brasília).',
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
