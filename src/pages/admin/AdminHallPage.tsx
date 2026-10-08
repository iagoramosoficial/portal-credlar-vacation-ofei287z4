import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Trophy,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Eye,
  Archive,
  ExternalLink,
  Users,
  Sparkles,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  adminService,
  HallItem,
  HallCategoria,
  HallStatus,
  LiderItem,
  ParametrosApp,
} from '@/services/adminService'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { useToast } from '@/hooks/use-toast'
import { getUrlPublica, formatarFotoUrl } from '@/lib/conteudo-padrao'
import { exportarParaCsv } from '@/lib/export-csv'
import {
  formatarDataHora,
  formatarApenasData,
  utcToLocalInputDate,
  dateStringToUtcIso,
} from '@/lib/timezone'
import pb from '@/lib/pocketbase/client'

const CATEGORIAS_CONFIG: Record<
  HallCategoria,
  { label: string; cor: string; icon: React.ElementType }
> = {
  destaque: {
    label: 'Destaque',
    cor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Sparkles,
  },
  tempo_de_casa: {
    label: 'Tempo de Casa',
    cor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Calendar,
  },
  reconhecimento: {
    label: 'Reconhecimento',
    cor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Award,
  },
  boas_vindas: {
    label: 'Boas-vindas',
    cor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Sparkles,
  },
}

export const AdminHallPage: React.FC = () => {
  const { usuario } = useAdminAuth()
  const { config } = useConteudoSite()
  const { toast } = useToast()
  const location = useLocation()

  const [homenagens, setHomenagens] = useState<HallItem[]>([])
  const [lideresAutorizados, setLideresAutorizados] = useState<LiderItem[]>([])
  const [parametros, setParametros] = useState<ParametrosApp | null>(null)
  const [loading, setLoading] = useState(true)

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  // Modais de Criação / Edição
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [editandoItem, setEditandoItem] = useState<HallItem | null>(null)
  const [salvandoForm, setSalvandoForm] = useState(false)

  // Campos do formulário
  const [formLiderId, setFormLiderId] = useState('')
  const [formCategoria, setFormCategoria] = useState<HallCategoria>('destaque')
  const [formTitulo, setFormTitulo] = useState('')
  const [formMotivo, setFormMotivo] = useState('')
  const [formPeriodo, setFormPeriodo] = useState('')
  const [formPublicarEm, setFormPublicarEm] = useState('')
  const [formExpiraEm, setFormExpiraEm] = useState('')
  const [formStatus, setFormStatus] = useState<HallStatus>('rascunho')
  const [formDestaqueHome, setFormDestaqueHome] = useState(false)

  // Modal Pré-visualização
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<{
    id?: string
    nome: string
    area?: string
    foto?: string
    foto_url?: string
    categoria: HallCategoria
    titulo?: string
    motivo: string
    periodo?: string
    status: HallStatus
  } | null>(null)

  // Modal Exclusão
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false)
  const [itemParaExcluir, setItemParaExcluir] = useState<HallItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Modal Arquivamento
  const [modalArquivarOpen, setModalArquivarOpen] = useState(false)
  const [itemParaArquivar, setItemParaArquivar] = useState<HallItem | null>(null)
  const [arquivando, setArquivando] = useState(false)

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [itensHall, listaLideres, params] = await Promise.all([
        adminService.getHallItems(),
        adminService.getLideres(),
        adminService.getParametros().catch(() => null),
      ])
      setHomenagens(itensHall)
      // APENAS líderes com status "autorizado" podem ser homenageados!
      const autorizados = listaLideres.filter((l) => l.status === 'autorizado')
      setLideresAutorizados(autorizados)
      setParametros(params)
    } catch {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações do Hall da Fama.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Verificar se veio com estado de pré-preenchimento vindo do alerta de Tempo de Casa (tela Início)
  useEffect(() => {
    if (loading || lideresAutorizados.length === 0) return

    const navState = location.state as {
      preencherHomenagem?: {
        liderId: string
        anos: number
        dataAniversario: string
      }
    } | null

    if (navState?.preencherHomenagem) {
      const { liderId, anos, dataAniversario } = navState.preencherHomenagem

      // Verificar se o líder está autorizado
      const liderExiste = lideresAutorizados.find((l) => l.id === liderId)
      if (liderExiste) {
        setEditandoItem(null)
        setFormLiderId(liderId)
        setFormCategoria('tempo_de_casa')
        setFormTitulo(`${anos} ${anos === 1 ? 'ano' : 'anos'} de casa`)
        setFormMotivo('') // Campo motivo fica vazio para a especialista escrever

        // Período = mês e ano da data do aniversário de casa (ex.: "Outubro/2026")
        const dtAniv = new Date(dataAniversario)
        let mesAno = ''
        if (!isNaN(dtAniv.getTime())) {
          const raw = dtAniv.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          mesAno = raw.charAt(0).toUpperCase() + raw.slice(1)
        } else {
          const raw = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          mesAno = raw.charAt(0).toUpperCase() + raw.slice(1)
        }
        setFormPeriodo(mesAno)

        // publicar_em = data do aniversário de casa no ano corrente (YYYY-MM-DD)
        const dtPub = !isNaN(dtAniv.getTime()) ? dtAniv : new Date()
        const pubYmd = dtPub.toISOString().split('T')[0]
        setFormPublicarEm(pubYmd)

        // expira_em = publicar_em + parametros.dias_validade_homenagem
        const diasValidade = parametros?.dias_validade_homenagem || 30
        const dtExp = new Date(dtPub.getTime() + diasValidade * 24 * 60 * 60 * 1000)
        setFormExpiraEm(dtExp.toISOString().split('T')[0])

        setFormStatus('rascunho')
        setFormDestaqueHome(false)
        setModalFormOpen(true)

        // Limpar state do history para evitar reabrir caso feche e navegue
        window.history.replaceState({}, document.title)
      }
    }
  }, [loading, lideresAutorizados, parametros, location.state])

  // Filtragem da lista
  const homenagensFiltradas = useMemo(() => {
    return homenagens.filter((h) => {
      const liderNome = h.expand?.lider?.nome_exibicao || h.expand?.lider?.nome || ''
      const liderArea = h.expand?.lider?.area || ''

      const matchesBusca =
        liderNome.toLowerCase().includes(busca.toLowerCase()) ||
        liderArea.toLowerCase().includes(busca.toLowerCase()) ||
        (h.titulo && h.titulo.toLowerCase().includes(busca.toLowerCase())) ||
        h.motivo.toLowerCase().includes(busca.toLowerCase()) ||
        (h.periodo && h.periodo.toLowerCase().includes(busca.toLowerCase()))

      const matchesStatus = filtroStatus === 'todos' || h.status === filtroStatus
      const matchesCategoria = filtroCategoria === 'todas' || h.categoria === filtroCategoria

      return matchesBusca && matchesStatus && matchesCategoria
    })
  }, [homenagens, busca, filtroStatus, filtroCategoria])

  // Abrir Modal de Nova Homenagem
  const handleNovaHomenagem = () => {
    setEditandoItem(null)
    setFormLiderId(lideresAutorizados.length > 0 ? lideresAutorizados[0].id : '')
    setFormCategoria('destaque')
    setFormTitulo('')
    setFormMotivo('')

    // Período sugerido ex: "Setembro/2026"
    const hoje = new Date()
    const mesAno = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const mesAnoCapitalizado = mesAno.charAt(0).toUpperCase() + mesAno.slice(1)
    setFormPeriodo(mesAnoCapitalizado)

    // Data de publicação hoje
    const hojeYmd = hoje.toISOString().split('T')[0]
    setFormPublicarEm(hojeYmd)

    // Validade sugerida a partir de parametros.dias_validade_homenagem (editável)
    const diasValidade = parametros?.dias_validade_homenagem || 30
    const dataFim = new Date(hoje.getTime() + diasValidade * 24 * 60 * 60 * 1000)
    setFormExpiraEm(dataFim.toISOString().split('T')[0])

    setFormStatus('rascunho')
    setFormDestaqueHome(false)
    setModalFormOpen(true)
  }

  // Abrir Modal de Editar Homenagem
  const handleEditarHomenagem = (item: HallItem) => {
    setEditandoItem(item)
    setFormLiderId(item.lider)
    setFormCategoria(item.categoria)
    setFormTitulo(item.titulo || '')
    setFormMotivo(item.motivo || '')
    setFormPeriodo(item.periodo || '')
    setFormPublicarEm(utcToLocalInputDate(item.publicar_em) || '')
    setFormExpiraEm(utcToLocalInputDate(item.expira_em) || '')
    setFormStatus(item.status)
    setFormDestaqueHome(item.destaque_home || false)
    setModalFormOpen(true)
  }

  // Abrir Pré-visualização antes de publicar
  const handleAbrirPreVisualizacao = () => {
    if (!formMotivo.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Preencha o motivo da homenagem antes de pré-visualizar.',
        variant: 'destructive',
      })
      return
    }

    const liderObj =
      lideresAutorizados.find((l) => l.id === formLiderId) || editandoItem?.expand?.lider

    // Montar foto_url a partir do registro do líder dono da foto (mesma lógica do servidor e da página pública)
    let fotoUrlPreview = ''
    if (liderObj && liderObj.foto) {
      fotoUrlPreview = pb.files.getURL(liderObj as any, liderObj.foto)
    }

    setPreviewItem({
      id: editandoItem?.id,
      nome: liderObj?.nome_exibicao || liderObj?.nome || 'Líder Homenageado',
      area: liderObj?.area,
      foto: liderObj?.foto,
      foto_url: fotoUrlPreview,
      categoria: formCategoria,
      titulo: formTitulo.trim() || undefined,
      motivo: formMotivo.trim(),
      periodo: formPeriodo.trim() || undefined,
      status: formStatus,
    })
    setModalPreviewOpen(true)
  }

  // Salvar Homenagem
  const handleSalvarHomenagem = async (statusFinal?: HallStatus) => {
    if (!formLiderId) {
      toast({
        title: 'Líder obrigatório',
        description: 'Selecione um líder com autorização vigente.',
        variant: 'destructive',
      })
      return
    }

    if (!formMotivo.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Escreva o motivo da homenagem.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoForm(true)
    const st = statusFinal || formStatus

    try {
      const payload = {
        lider: formLiderId,
        categoria: formCategoria,
        titulo: formTitulo.trim() || undefined,
        motivo: formMotivo.trim(),
        periodo: formPeriodo.trim() || undefined,
        publicar_em: formPublicarEm ? dateStringToUtcIso(formPublicarEm, false) : undefined,
        expira_em: formExpiraEm ? dateStringToUtcIso(formExpiraEm, true) : undefined,
        status: st,
        destaque_home: formDestaqueHome,
      }

      if (editandoItem) {
        const atualizado = await adminService.updateHallItem(editandoItem.id, payload)
        setHomenagens((prev) => prev.map((h) => (h.id === atualizado.id ? atualizado : h)))
        toast({ title: 'Homenagem atualizada com sucesso.' })
      } else {
        const novo = await adminService.createHallItem(payload)
        setHomenagens((prev) => [novo, ...prev])
        toast({ title: 'Homenagem criada com sucesso.' })
      }

      setModalFormOpen(false)
      setModalPreviewOpen(false)
    } catch (err: unknown) {
      const pbErr = err as { message?: string }
      toast({
        title: 'Erro ao salvar homenagem',
        description: pbErr?.message || 'Verifique os dados informados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoForm(false)
    }
  }

  // Confirmar Arquivamento
  const handleConfirmarArquivamento = async () => {
    if (!itemParaArquivar) return
    setArquivando(true)
    try {
      const atualizado = await adminService.updateHallItem(itemParaArquivar.id, {
        status: 'arquivado',
        destaque_home: false,
      })
      setHomenagens((prev) => prev.map((h) => (h.id === atualizado.id ? atualizado : h)))
      toast({ title: 'Homenagem arquivada com sucesso.' })
      setModalArquivarOpen(false)
    } catch {
      toast({
        title: 'Erro ao arquivar',
        description: 'Não foi possível arquivar a homenagem.',
        variant: 'destructive',
      })
    } finally {
      setArquivando(false)
    }
  }

  // Confirmar Exclusão
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return
    setExcluindo(true)
    try {
      await adminService.deleteHallItem(itemParaExcluir.id)
      setHomenagens((prev) => prev.filter((h) => h.id !== itemParaExcluir.id))
      toast({ title: 'Homenagem excluída com sucesso.' })
      setModalExcluirOpen(false)
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a homenagem.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Exportar Planilha (CSV)
  const handleExportarCsv = () => {
    if (homenagensFiltradas.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há homenagens para exportar com os filtros atuais.',
      })
      return
    }

    exportarParaCsv(
      'hall_da_fama_homenagens',
      [
        {
          header: 'Homenageado',
          accessor: (h) => h.expand?.lider?.nome_exibicao || h.expand?.lider?.nome || '',
        },
        {
          header: 'Área',
          accessor: (h) => h.expand?.lider?.area || '',
        },
        {
          header: 'Categoria',
          accessor: (h) => CATEGORIAS_CONFIG[h.categoria]?.label || h.categoria,
        },
        {
          header: 'Título',
          accessor: (h) => h.titulo || '',
        },
        {
          header: 'Período',
          accessor: (h) => h.periodo || '',
        },
        {
          header: 'Status',
          accessor: (h) => h.status,
        },
        {
          header: 'Destaque Home',
          accessor: (h) => (h.destaque_home ? 'Sim' : 'Não'),
        },
        {
          header: 'Publicar Em',
          accessor: (h) => (h.publicar_em ? formatarApenasData(h.publicar_em) : ''),
        },
        {
          header: 'Expira Em',
          accessor: (h) => (h.expira_em ? formatarApenasData(h.expira_em) : ''),
        },
        {
          header: 'Criado Em (Brasília)',
          accessor: (h) => formatarDataHora(h.created),
        },
      ],
      homenagensFiltradas,
    )

    toast({
      title: 'Planilha exportada',
      description: 'O arquivo CSV do Hall da Fama foi baixado com sucesso.',
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/25 mb-2">
            <Trophy className="w-3.5 h-3.5 text-brand-gold" />
            Etapa 1E — Hall da Fama
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Hall da Fama</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Reconhecimento público de líderes autorizados por tempo de casa, conquistas e destaque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportarCsv}
            disabled={loading || homenagensFiltradas.length === 0}
            className="border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-white text-xs h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar CSV
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-white text-xs h-9"
          >
            <a href="/hall-da-fama" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Ver Página Pública
            </a>
          </Button>

          <Button
            onClick={handleNovaHomenagem}
            className="bg-gradient-brand text-white hover:opacity-90 font-semibold text-xs h-9 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Homenagem
          </Button>
        </div>
      </div>

      {/* Aviso se não houver líderes autorizados */}
      {lideresAutorizados.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm">
              <strong className="text-white">Nenhum líder autorizado no momento:</strong> Homenagens
              só podem ser criadas para líderes que concluíram o aceite de uso de imagem.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 text-xs shrink-0"
          >
            <Link to="/admin/lideres">Ir para Líderes</Link>
          </Button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por líder, área, título ou motivo..."
            className="pl-9 bg-neutral-900/70 border-neutral-800 text-white placeholder:text-neutral-500 text-xs h-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] bg-neutral-900/70 border-neutral-800 text-neutral-200 text-xs h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="publicado">Publicados</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="arquivado">Arquivados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[160px] bg-neutral-900/70 border-neutral-800 text-neutral-200 text-xs h-10">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
              <SelectItem value="todas">Todas Categorias</SelectItem>
              <SelectItem value="destaque">Destaque</SelectItem>
              <SelectItem value="tempo_de_casa">Tempo de Casa</SelectItem>
              <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
              <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Homenagens */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <div className="w-7 h-7 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Carregando homenagens do Hall da Fama...</p>
          </div>
        ) : homenagensFiltradas.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 space-y-3">
            <Trophy className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-medium text-neutral-300">Nenhuma homenagem encontrada</p>
            <p className="text-xs text-neutral-500">
              Clique em &quot;Nova Homenagem&quot; para reconhecer seu primeiro líder no Hall da
              Fama.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/70 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3.5">Homenageado</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Período</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Vigência (Brasília)</th>
                  <th className="px-4 py-3.5">Home</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {homenagensFiltradas.map((item) => {
                  const lider = item.expand?.lider
                  const nome = lider?.nome_exibicao || lider?.nome || 'Líder'
                  const area = lider?.area || ''
                  const cat = CATEGORIAS_CONFIG[item.categoria] || {
                    label: item.categoria,
                    cor: 'bg-neutral-800 text-neutral-300 border-neutral-700',
                    icon: Trophy,
                  }
                  const CatIcon = cat.icon
                  const fotoUrl = lider?.foto ? pb.files.getURL(lider as any, lider.foto) : ''

                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt={nome}
                              className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0 bg-neutral-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 shrink-0">
                              <Trophy className="w-5 h-5 text-neutral-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{nome}</p>
                            {area && (
                              <p className="text-[11px] text-neutral-400 truncate">{area}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cat.cor}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-neutral-300">
                        {item.periodo || '—'}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase tracking-wider ${
                            item.status === 'publicado'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.status === 'rascunho'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-neutral-400">
                        <div>
                          <span>
                            De:{' '}
                            {item.publicar_em ? formatarApenasData(item.publicar_em) : 'Imediato'}
                          </span>
                        </div>
                        <div>
                          <span>
                            Até:{' '}
                            {item.expira_em ? formatarApenasData(item.expira_em) : 'Indeterminado'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.destaque_home ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                            ★ Sim
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">Não</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditarHomenagem(item)}
                            className="h-8 px-2 text-neutral-300 hover:text-white hover:bg-neutral-800"
                            title="Editar Homenagem"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {item.status !== 'arquivado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setItemParaArquivar(item)
                                setModalArquivarOpen(true)
                              }}
                              className="h-8 px-2 text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10"
                              title="Arquivar Homenagem"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setItemParaExcluir(item)
                              setModalExcluirOpen(true)
                            }}
                            className="h-8 px-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Excluir Homenagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulário (Criar / Editar) */}
      <Dialog open={modalFormOpen} onOpenChange={setModalFormOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-gold" />
              {editandoItem ? 'Editar Homenagem' : 'Nova Homenagem no Hall da Fama'}
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Apenas líderes com status &quot;autorizado&quot; podem ser homenageados.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSalvarHomenagem()
            }}
            className="space-y-4 pt-2"
          >
            {/* Escolha do Líder */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Líder Autorizado <span className="text-red-400">*</span>
              </label>
              {lideresAutorizados.length === 0 ? (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-xs text-red-300 flex items-center justify-between">
                  <span>Nenhum líder autorizado disponível.</span>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-red-400/40 text-red-200 text-xs"
                  >
                    <Link to="/admin/lideres">Ver Líderes</Link>
                  </Button>
                </div>
              ) : (
                <Select value={formLiderId} onValueChange={setFormLiderId}>
                  <SelectTrigger className="bg-neutral-800/80 border-neutral-700 text-white text-xs">
                    <SelectValue placeholder="Selecione o líder..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-60">
                    {lideresAutorizados.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_exibicao || l.nome} {l.area ? `(${l.area})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Categoria e Período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200">
                  Categoria <span className="text-red-400">*</span>
                </label>
                <Select
                  value={formCategoria}
                  onValueChange={(val: HallCategoria) => setFormCategoria(val)}
                >
                  <SelectTrigger className="bg-neutral-800/80 border-neutral-700 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="destaque">Destaque</SelectItem>
                    <SelectItem value="tempo_de_casa">Tempo de Casa</SelectItem>
                    <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                    <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-200">
                  Período de Referência
                </label>
                <Input
                  value={formPeriodo}
                  onChange={(e) => setFormPeriodo(e.target.value)}
                  placeholder="Ex: Setembro/2026, 3º Trimestre/2026"
                  className="bg-neutral-800/80 border-neutral-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Título opcional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Título da Homenagem (Opcional)
              </label>
              <Input
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: 5 Anos Construindo o Futuro, Destaque em Liderança"
                className="bg-neutral-800/80 border-neutral-700 text-white text-xs"
              />
            </div>

            {/* Motivo obrigatório */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Motivo / História de Reconhecimento <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={formMotivo}
                onChange={(e) => setFormMotivo(e.target.value)}
                placeholder="Descreva as conquistas, legado e razões que tornam esse líder especial..."
                rows={4}
                className="bg-neutral-800/80 border-neutral-700 text-white text-xs leading-relaxed"
              />
            </div>

            {/* Vigência: Publicar Em e Expira Em */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="hall_publicar_em"
                  className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                  Publicar em (Início)
                </label>
                <div className="relative flex items-center">
                  <Input
                    id="hall_publicar_em"
                    type="date"
                    value={formPublicarEm}
                    onChange={(e) => setFormPublicarEm(e.target.value)}
                    className="bg-neutral-950 border-neutral-700 text-white text-xs [color-scheme:dark] pr-9 focus:border-brand-gold"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const el = document.getElementById(
                        'hall_publicar_em',
                      ) as HTMLInputElement | null
                      try {
                        if (el && 'showPicker' in el) {
                          ;(el as any).showPicker()
                        } else {
                          el?.focus()
                        }
                      } catch {
                        el?.focus()
                      }
                    }}
                    className="absolute right-2.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Abrir seletor de data"
                  >
                    <Calendar className="w-4 h-4 text-brand-gold" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hall_expira_em"
                  className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                  Expira em (Término Sugerido)
                </label>
                <div className="relative flex items-center">
                  <Input
                    id="hall_expira_em"
                    type="date"
                    value={formExpiraEm}
                    onChange={(e) => setFormExpiraEm(e.target.value)}
                    className="bg-neutral-950 border-neutral-700 text-white text-xs [color-scheme:dark] pr-9 focus:border-brand-gold"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const el = document.getElementById(
                        'hall_expira_em',
                      ) as HTMLInputElement | null
                      try {
                        if (el && 'showPicker' in el) {
                          ;(el as any).showPicker()
                        } else {
                          el?.focus()
                        }
                      } catch {
                        el?.focus()
                      }
                    }}
                    className="absolute right-2.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Abrir seletor de data"
                  >
                    <Calendar className="w-4 h-4 text-brand-gold" />
                  </button>
                </div>
              </div>
            </div>

            {/* Destaque na Home e Status */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  Destaque na Página Inicial (Home)
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Exibe o líder na faixa animada rotativa do topo do portal.
                </p>
              </div>
              <Switch checked={formDestaqueHome} onCheckedChange={setFormDestaqueHome} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">Estado da Homenagem</label>
              <Select value={formStatus} onValueChange={(val: HallStatus) => setFormStatus(val)}>
                <SelectTrigger className="bg-neutral-800/80 border-neutral-700 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="rascunho">Rascunho (Não visível publicamente)</SelectItem>
                  <SelectItem value="publicado">Publicado (Visível dentro da vigência)</SelectItem>
                  <SelectItem value="arquivado">
                    Arquivado (Histórico / Homenageados anteriores)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAbrirPreVisualizacao}
                className="border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Pré-visualizar
              </Button>

              <div className="flex-1" />

              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalFormOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={salvandoForm}
                onClick={() => handleSalvarHomenagem('rascunho')}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
              >
                Salvar Rascunho
              </Button>

              <Button
                type="button"
                disabled={salvandoForm}
                onClick={() => handleSalvarHomenagem('publicado')}
                className="bg-gradient-brand text-white hover:opacity-90 font-semibold text-xs shadow-md"
              >
                {salvandoForm ? 'Salvando...' : 'Publicar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pré-visualização antes de publicar */}
      <Dialog open={modalPreviewOpen} onOpenChange={setModalPreviewOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-gold" />
              Pré-visualização do Card Público
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Assim a homenagem será exibida na página pública do Hall da Fama.
            </DialogDescription>
          </DialogHeader>

          {previewItem && (
            <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200 p-6 text-neutral-900 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {previewItem.foto_url ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[2px] bg-gradient-to-tr from-brand-gold via-amber-400 to-yellow-200 shadow-md">
                      <img
                        src={formatarFotoUrl(previewItem.foto_url, pb.baseUrl)}
                        alt={previewItem.nome}
                        className="w-full h-full object-cover rounded-xl bg-neutral-100"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-gold via-amber-400 to-yellow-200 p-[2px] shadow">
                      <div className="w-full h-full rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold">
                        <Trophy className="w-8 h-8 text-brand-gold/60" />
                      </div>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-neutral-950 font-bold text-[10px] shadow">
                    ★
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 mb-1">
                    {CATEGORIAS_CONFIG[previewItem.categoria]?.label || previewItem.categoria}
                  </span>
                  <h3 className="font-bold text-xl text-neutral-900 leading-tight">
                    {previewItem.nome}
                  </h3>
                  {previewItem.area && (
                    <p className="text-xs text-neutral-500">{previewItem.area}</p>
                  )}
                </div>
              </div>

              {previewItem.titulo && (
                <h4 className="text-sm font-bold text-neutral-800">{previewItem.titulo}</h4>
              )}

              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                {previewItem.motivo}
              </p>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                <span>{previewItem.periodo || 'Vigente'}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  Compartilhar no WhatsApp
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalPreviewOpen(false)}
              className="border-neutral-700 text-neutral-300 text-xs"
            >
              Voltar à Edição
            </Button>
            <Button
              type="button"
              onClick={() => handleSalvarHomenagem('publicado')}
              className="bg-gradient-brand text-white font-semibold text-xs"
            >
              Confirmar e Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Arquivar */}
      <Dialog open={modalArquivarOpen} onOpenChange={setModalArquivarOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400" />
              Arquivar Homenagem
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              A homenagem deixará o destaque da página principal e ficará acessível apenas na seção
              de &quot;Homenageados Anteriores&quot;.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-neutral-800">
            <Button
              variant="ghost"
              onClick={() => setModalArquivarOpen(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              disabled={arquivando}
              onClick={handleConfirmarArquivamento}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              {arquivando ? 'Arquivando...' : 'Confirmar Arquivamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir */}
      <Dialog open={modalExcluirOpen} onOpenChange={setModalExcluirOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Excluir Homenagem
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Tem certeza que deseja excluir esta homenagem? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-neutral-800">
            <Button
              variant="ghost"
              onClick={() => setModalExcluirOpen(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              disabled={excluindo}
              onClick={handleConfirmarExclusao}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
            >
              {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default AdminHallPage
