import React, { useEffect } from 'react'
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  LayoutDashboard,
  Globe,
  Layers,
  Users,
  History,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  MousePointerClick,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { adminService, CliqueItem } from '@/services/adminService'
import { exportarParaCsv } from '@/lib/export-csv'
import { formatarDataHora } from '@/lib/timezone'
import { useToast } from '@/hooks/use-toast'

export const AdminLayout: React.FC = () => {
  const { usuario, isAuthenticated, isLoading, logout } = useAdminAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cliquesModalOpen, setCliquesModalOpen] = useState(false)
  const [cliquesLoading, setCliquesLoading] = useState(false)
  const [cliquesList, setCliquesList] = useState<CliqueItem[]>([])
  const { toast } = useToast()

  // Garantir meta tag noindex em todas as páginas /admin
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]')
    const existed = !!metaTag
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute('name', 'robots')
      document.head.appendChild(metaTag)
    }
    const previousContent = metaTag.getAttribute('content')
    metaTag.setAttribute('content', 'noindex, nofollow')

    return () => {
      if (!existed && metaTag) {
        metaTag.remove()
      } else if (metaTag && previousContent !== null) {
        metaTag.setAttribute('content', previousContent)
      } else if (metaTag) {
        metaTag.removeAttribute('content')
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const isAdmin = usuario?.papel === 'admin'

  const navItems: Array<{ label: string; path: string; icon: React.ElementType }> = [
    { label: 'Início', path: '/admin', icon: LayoutDashboard },
    { label: 'Líderes', path: '/admin/lideres', icon: Users },
    { label: 'Textos do Site', path: '/admin/site', icon: Globe },
    { label: 'Cards da Home', path: '/admin/cards', icon: Layers },
    ...(isAdmin
      ? [{ label: 'Marca & Configurações', path: '/admin/configuracoes', icon: Sliders }]
      : []),
    { label: 'Histórico de Alterações', path: '/admin/historico', icon: History },
  ]

  const handleOpenCliquesModal = async () => {
    setCliquesModalOpen(true)
    setCliquesLoading(true)
    try {
      const data = await adminService.getCliques()
      setCliquesList(data)
    } catch (err) {
      toast({
        title: 'Erro ao carregar telemetria',
        description: 'Não foi possível carregar os cliques registrados.',
        variant: 'destructive',
      })
    } finally {
      setCliquesLoading(false)
    }
  }

  const handleExportCliques = () => {
    if (cliquesList.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há registros de cliques para exportar.',
      })
      return
    }

    exportarParaCsv(
      'cliques_telemetria',
      [
        {
          header: 'Data/Hora (Brasília)',
          accessor: (c) => formatarDataHora(c.created),
        },
        {
          header: 'Alvo / Card',
          accessor: (c) => c.alvo,
        },
        {
          header: 'Tipo',
          accessor: (c) => c.tipo,
        },
      ],
      cliquesList,
    )

    toast({
      title: 'Planilha exportada',
      description: 'O arquivo CSV de cliques foi baixado com sucesso.',
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-xs shadow-md">
            CV
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            Painel Administrativo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-neutral-400 hover:text-white text-xs px-2 h-8"
            title="Sair do painel"
          >
            <LogOut className="w-4 h-4 mr-1 text-red-400" />
            Sair
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-neutral-950/95 flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
                CV
              </div>
              <div>
                <p className="font-semibold text-sm text-white">Painel Administrativo</p>
                <p className="text-xs text-neutral-400">{usuario?.nome}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-neutral-800 text-white border-l-4 border-brand-orange pl-2.5'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? 'text-brand-orange' : 'text-neutral-400'}`}
                  />
                  {item.label}
                </Link>
              )
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleOpenCliquesModal()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <MousePointerClick className="w-4 h-4 text-brand-lilac" />
              Cliques & Telemetria
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <ExternalLink className="w-4 h-4 text-neutral-400" />
              Visualizar Site Público
            </a>
          </nav>

          <div className="pt-4 border-t border-neutral-800">
            <Button
              variant="outline"
              onClick={() => {
                setMobileMenuOpen(false)
                logout()
              }}
              className="w-full justify-center border-neutral-700 bg-neutral-900/80 hover:bg-red-500/10 hover:text-red-400 text-neutral-200"
            >
              <LogOut className="w-4 h-4 mr-2 text-red-400" />
              Sair do Painel
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-950 border-r border-neutral-800/70 p-5 shrink-0 justify-between min-h-screen">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-neutral-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-red/10">
              CV
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white leading-tight">
                Painel Administrativo
              </h1>
              <p className="text-xs text-neutral-500 font-medium">Gestão de Conteúdo</p>
            </div>
          </div>

          {/* User info badge */}
          <div className="mt-4 px-3 py-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-neutral-200 truncate">{usuario?.nome}</p>
              <p className="text-[11px] text-neutral-400 truncate">{usuario?.email}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20 shrink-0">
              {usuario?.papel}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-neutral-800/90 text-white border-l-2 border-brand-orange shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? 'text-brand-orange' : 'text-neutral-400'}`}
                  />
                  {item.label}
                </Link>
              )
            })}

            <button
              onClick={handleOpenCliquesModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80 transition"
            >
              <MousePointerClick className="w-4 h-4 text-brand-lilac" />
              Cliques & Telemetria
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-neutral-800/70 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 transition group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />
              Ver Site Público
            </span>
          </a>

          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 px-3 h-9"
          >
            <LogOut className="w-4 h-4 mr-2 text-red-400" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-w-full">
        <Outlet />
      </main>

      {/* Modal de Cliques & Telemetria */}
      <Dialog open={cliquesModalOpen} onOpenChange={setCliquesModalOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-brand-lilac" />
                <DialogTitle className="text-lg text-white">Cliques & Telemetria</DialogTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCliques}
                disabled={cliquesLoading || cliquesList.length === 0}
                className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white hover:text-white text-xs"
              >
                Exportar planilha (CSV)
              </Button>
            </div>
            <DialogDescription className="text-neutral-400 text-xs">
              Registro de cliques nos cards e links da página inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {cliquesLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <div className="w-6 h-6 border-2 border-brand-lilac border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Carregando registros de cliques...</p>
              </div>
            ) : cliquesList.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-sm">
                Nenhum clique registrado até o momento.
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/70 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-2.5">Data / Hora (Brasília)</th>
                      <th className="px-4 py-2.5">Alvo / Card</th>
                      <th className="px-4 py-2.5">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                    {cliquesList.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-800/40 transition">
                        <td className="px-4 py-2.5 whitespace-nowrap text-neutral-400 font-sans">
                          {formatarDataHora(c.created)}
                        </td>
                        <td className="px-4 py-2.5 font-sans font-medium text-white">{c.alvo}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-sans bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {c.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
