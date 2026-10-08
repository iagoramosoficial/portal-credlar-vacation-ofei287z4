import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Archive,
  Image as ImageIcon,
  ExternalLink,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { adminService, EventoItem, EventoStatus } from '@/services/adminService'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { exportarParaCsv } from '@/lib/export-csv'
import { formatarDataHora, dateStringToUtcIso, utcToLocalInputDateTime } from '@/lib/timezone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export const AdminAgendaPage: React.FC = () => {
  const { usuario } = useAdminAuth()
  const { toast } = useToast()

  const [eventos, setEventos] = useState<EventoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Modal de Criar/Editar
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<EventoItem | null>(null)

  // Formulário
  const [formTitulo, setFormTitulo] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formDataInicio, setFormDataInicio] = useState('')
  const [formDataFim, setFormDataFim] = useState('')
  const [formLocal, setFormLocal] = useState('')
  const [formLink, setFormLink] = useState('')
  const [formLinkFotos, setFormLinkFotos] = useState('')
  const [formDestaque, setFormDestaque] = useState(false)
  const [formStatus, setFormStatus] = useState<EventoStatus>('publicado')

  // Imagem
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal de Exclusão
  const [eventoParaExcluir, setEventoParaExcluir] = useState<EventoItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Modal de Arquivamento
  const [eventoParaArquivar, setEventoParaArquivar] = useState<EventoItem | null>(null)
  const [arquivando, setArquivando] = useState(false)

  // Modal de Pré-visualização
  const [eventoPrevia, setEventoPrevia] = useState<EventoItem | null>(null)

  const carregarEventos = async () => {
    try {
      setCarregando(true)
      const lista = await adminService.getEventosAdmin()
      setEventos(lista)
    } catch {
      toast({
        title: 'Erro ao carregar eventos',
        description: 'Não foi possível buscar a lista de eventos no servidor.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarEventos()
  }, [])

  const abrirNovo = () => {
    setEventoEditando(null)
    setFormTitulo('')
    setFormDescricao('')
    setFormDataInicio('')
    setFormDataFim('')
    setFormLocal('')
    setFormLink('')
    setFormLinkFotos('')
    setFormDestaque(false)
    setFormStatus('publicado')
    setImagemArquivo(null)
    setImagemPreview(null)
    setModalAberto(true)
  }

  const abrirEditar = (ev: EventoItem) => {
    setEventoEditando(ev)
    setFormTitulo(ev.titulo)
    setFormDescricao(ev.descricao || '')
    setFormDataInicio(utcToLocalInputDateTime(ev.data_hora_inicio))
    setFormDataFim(ev.data_hora_fim ? utcToLocalInputDateTime(ev.data_hora_fim) : '')
    setFormLocal(ev.local || '')
    setFormLink(ev.link || '')
    setFormLinkFotos(ev.link_fotos || '')
    setFormDestaque(ev.destaque_home)
    setFormStatus(ev.status)
    setImagemArquivo(null)
    setImagemPreview(ev.imagem ? pb.files.getURL(ev, ev.imagem) : null)
    setModalAberto(true)
  }

  const handleSelecionarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Envie uma imagem em formato JPG, PNG ou WEBP.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5 MB.',
        variant: 'destructive',
      })
      return
    }

    setImagemArquivo(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagemPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formTitulo.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe o título do evento.',
        variant: 'destructive',
      })
      return
    }

    if (!formDataInicio) {
      toast({
        title: 'Data de início obrigatória',
        description: 'Informe a data e horário de início do evento.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)

      const dataInicioUtc = dateStringToUtcIso(formDataInicio, false)
      const dataFimUtc = formDataFim ? dateStringToUtcIso(formDataFim, false) : ''

      const formData = new FormData()
      formData.append('titulo', formTitulo.trim())
      formData.append('descricao', formDescricao.trim())
      formData.append('data_hora_inicio', dataInicioUtc)
      if (dataFimUtc) {
        formData.append('data_hora_fim', dataFimUtc)
      } else {
        formData.append('data_hora_fim', '')
      }
      formData.append('local', formLocal.trim())
      formData.append('link', formLink.trim())
      formData.append('link_fotos', formLinkFotos.trim())
      formData.append('destaque_home', String(formDestaque))
      formData.append('status', formStatus)

      if (imagemArquivo) {
        formData.append('imagem', imagemArquivo)
      }

      if (eventoEditando) {
        await adminService.updateEvento(eventoEditando.id, formData)
        toast({
          title: 'Evento atualizado',
          description: `O evento "${formTitulo.trim()}" foi atualizado com sucesso.`,
        })
      } else {
        await adminService.createEvento(formData)
        toast({
          title: 'Evento criado',
          description: `O evento "${formTitulo.trim()}" foi criado com sucesso.`,
        })
      }

      setModalAberto(false)
      carregarEventos()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar evento',
        description: err instanceof Error ? err.message : 'Falha ao gravar evento no servidor.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleConfirmarExcluir = async () => {
    if (!eventoParaExcluir) return
    try {
      setExcluindo(true)
      await adminService.deleteEvento(eventoParaExcluir.id)
      toast({
        title: 'Evento excluído',
        description: `O evento "${eventoParaExcluir.titulo}" foi removido definitivamente.`,
      })
      setEventoParaExcluir(null)
      carregarEventos()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o evento.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const handleConfirmarArquivar = async () => {
    if (!eventoParaArquivar) return
    try {
      setArquivando(true)
      await adminService.updateEvento(eventoParaArquivar.id, {
        status: 'arquivado',
        destaque_home: false,
      })
      toast({
        title: 'Evento arquivado',
        description: `O evento "${eventoParaArquivar.titulo}" foi marcado como arquivado.`,
      })
      setEventoParaArquivar(null)
      carregarEventos()
    } catch {
      toast({
        title: 'Erro ao arquivar',
        description: 'Não foi possível arquivar o evento.',
        variant: 'destructive',
      })
    } finally {
      setArquivando(false)
    }
  }

  const handleExportarCsv = () => {
    if (eventos.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há eventos para exportar.',
      })
      return
    }

    exportarParaCsv(
      'agenda_eventos',
      [
        { header: 'Título', accessor: (ev) => ev.titulo },
        { header: 'Status', accessor: (ev) => ev.status },
        { header: 'Destaque Home', accessor: (ev) => (ev.destaque_home ? 'Sim' : 'Não') },
        {
          header: 'Data/Hora Início (Brasília)',
          accessor: (ev) => formatarDataHora(ev.data_hora_inicio),
        },
        {
          header: 'Data/Hora Fim (Brasília)',
          accessor: (ev) => (ev.data_hora_fim ? formatarDataHora(ev.data_hora_fim) : ''),
        },
        { header: 'Local', accessor: (ev) => ev.local || '' },
        { header: 'Link do Evento', accessor: (ev) => ev.link || '' },
        { header: 'Link das Fotos', accessor: (ev) => ev.link_fotos || '' },
        { header: 'Descrição', accessor: (ev) => ev.descricao || '' },
      ],
      eventosFiltrados,
    )

    toast({
      title: 'Planilha exportada',
      description: 'O arquivo CSV de eventos foi baixado com sucesso.',
    })
  }

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      if (filtroStatus !== 'todos' && ev.status !== filtroStatus) return false
      if (!busca.trim()) return true
      const termo = busca.toLowerCase()
      return (
        ev.titulo.toLowerCase().includes(termo) ||
        (ev.descricao && ev.descricao.toLowerCase().includes(termo)) ||
        (ev.local && ev.local.toLowerCase().includes(termo))
      )
    })
  }, [eventos, filtroStatus, busca])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Agenda & Eventos Corporativos
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Gerencie encontros, palestras e celebrações com contagem regressiva e links de fotos
            pós-evento.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            disabled={carregando || eventosFiltrados.length === 0}
            className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            Exportar CSV
          </Button>

          <Button
            onClick={abrirNovo}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs gap-1.5 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, local ou descrição..."
            className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px] bg-neutral-950 border-neutral-800 text-white text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="publicado">Publicados</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="arquivado">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de Eventos */}
      {carregando ? (
        <div className="p-16 flex flex-col items-center justify-center text-neutral-400 gap-3 bg-neutral-900/40 rounded-2xl border border-neutral-800">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-xs">Carregando eventos...</p>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="p-16 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800 space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Nenhum evento encontrado</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {busca || filtroStatus !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros selecionados.'
                : 'Cadastre o primeiro evento corporativo clicando em Novo Evento.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventosFiltrados.map((ev) => {
            const imagemUrl = ev.imagem ? pb.files.getURL(ev, ev.imagem) : null

            return (
              <div
                key={ev.id}
                className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-all shadow-sm"
              >
                <div className="space-y-3.5">
                  {/* Topo do Card com Imagem e Badges */}
                  <div className="flex items-start gap-3.5">
                    {imagemUrl ? (
                      <img
                        src={imagemUrl}
                        alt={ev.titulo}
                        className="w-16 h-16 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                        <ImageIcon className="w-7 h-7 text-neutral-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            ev.status === 'publicado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : ev.status === 'rascunho'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {ev.status}
                        </span>

                        {ev.destaque_home && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                            Destaque Home
                          </span>
                        )}
                      </div>

                      <h3
                        className="font-bold text-white text-base leading-tight truncate"
                        title={ev.titulo}
                      >
                        {ev.titulo}
                      </h3>
                    </div>
                  </div>

                  {/* Informações de Data / Local */}
                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                      <span className="truncate">{formatarDataHora(ev.data_hora_inicio)}</span>
                    </div>

                    {ev.local && (
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{ev.local}</span>
                      </div>
                    )}

                    {ev.link_fotos && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span>Álbum de fotos cadastrado</span>
                      </div>
                    )}
                  </div>

                  {ev.descricao && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {ev.descricao}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEventoPrevia(ev)}
                      className="text-neutral-400 hover:text-white p-2 h-8"
                      title="Pré-visualizar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => abrirEditar(ev)}
                      className="text-neutral-400 hover:text-white p-2 h-8"
                      title="Editar evento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {ev.status !== 'arquivado' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEventoParaArquivar(ev)}
                        className="text-neutral-400 hover:text-amber-400 p-2 h-8"
                        title="Arquivar evento"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEventoParaExcluir(ev)}
                      className="text-neutral-400 hover:text-red-400 p-2 h-8"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Evento */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-orange" />
              {eventoEditando ? 'Editar Evento' : 'Novo Evento da Agenda'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="titulo" className="text-xs font-medium text-neutral-300">
                Título do Evento *
              </Label>
              <Input
                id="titulo"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                required
                placeholder="Ex: Workshop de Liderança e Governança 2025"
                className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
              />
            </div>

            {/* Imagem do Evento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-300">
                Imagem / Capa do Evento (miniatura quadrada, máx. 5 MB)
              </Label>
              <div className="flex items-center gap-4">
                {imagemPreview ? (
                  <img
                    src={imagemPreview}
                    alt="Prévia"
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSelecionarImagem}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-white text-xs"
                  >
                    {imagemPreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                  </Button>
                  <p className="text-[11px] text-neutral-500">Formatos aceitos: JPG, PNG ou WEBP</p>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio" className="text-xs font-medium text-neutral-300">
                  Data e Hora de Início (Brasília) *
                </Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formDataInicio}
                  onChange={(e) => setFormDataInicio(e.target.value)}
                  required
                  className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="data_fim" className="text-xs font-medium text-neutral-300">
                  Data e Hora de Término (opcional)
                </Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formDataFim}
                  onChange={(e) => setFormDataFim(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Local e Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="local" className="text-xs font-medium text-neutral-300">
                  Local Presencial (opcional)
                </Label>
                <Input
                  id="local"
                  value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}
                  placeholder="Ex: Auditório Principal ou Sala 3"
                  className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link" className="text-xs font-medium text-neutral-300">
                  Link / Transmissão Online (opcional)
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://zoom.us/j/... ou Meet"
                  className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-medium text-neutral-300">
                Descrição do Evento (opcional)
              </Label>
              <Textarea
                id="descricao"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Detalhes, palestrantes convidados, cronograma ou recomendações..."
                rows={3}
                className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
              />
            </div>

            {/* Link das Fotos (pós-evento) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="link_fotos"
                className="text-xs font-medium text-neutral-300 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-brand-orange" />
                Link do Álbum de Fotos (preenchido após o evento)
              </Label>
              <Input
                id="link_fotos"
                type="url"
                value={formLinkFotos}
                onChange={(e) => setFormLinkFotos(e.target.value)}
                placeholder="https://photos.google.com/share/... ou OneDrive"
                className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
              />
            </div>

            {/* Status e Destaque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-medium text-neutral-300">
                  Status de Publicação *
                </Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as EventoStatus)}
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="publicado">Publicado (visível no site)</SelectItem>
                    <SelectItem value="rascunho">Rascunho (apenas admin)</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-5">
                <div>
                  <Label
                    htmlFor="destaque_home"
                    className="text-xs font-medium text-neutral-300 cursor-pointer"
                  >
                    Destaque na Home
                  </Label>
                  <p className="text-[11px] text-neutral-500">
                    Exibe contagem regressiva no portal.
                  </p>
                </div>
                <Switch
                  id="destaque_home"
                  checked={formDestaque}
                  onCheckedChange={setFormDestaque}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-neutral-800 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs gap-2"
              >
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {eventoEditando ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pré-visualização */}
      <Dialog open={!!eventoPrevia} onOpenChange={(open) => !open && setEventoPrevia(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-orange" />
              Pré-visualização do Evento
            </DialogTitle>
          </DialogHeader>

          {eventoPrevia && (
            <div className="space-y-4 pt-2">
              {eventoPrevia.imagem && (
                <div className="w-full h-44 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                  <img
                    src={pb.files.getURL(eventoPrevia, eventoPrevia.imagem)}
                    alt={eventoPrevia.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 uppercase">
                    {eventoPrevia.status}
                  </span>
                  {eventoPrevia.destaque_home && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                      Destaque Home
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white">{eventoPrevia.titulo}</h3>

                <div className="text-xs text-neutral-300 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-orange" />
                    <strong>Início:</strong> {formatarDataHora(eventoPrevia.data_hora_inicio)}
                    {eventoPrevia.data_hora_fim && (
                      <span> - Término: {formatarDataHora(eventoPrevia.data_hora_fim)}</span>
                    )}
                  </p>
                  {eventoPrevia.local && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <strong>Local:</strong> {eventoPrevia.local}
                    </p>
                  )}
                </div>

                {eventoPrevia.descricao && (
                  <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line pt-2 border-t border-neutral-800">
                    {eventoPrevia.descricao}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-neutral-800">
            <Button
              variant="outline"
              onClick={() => setEventoPrevia(null)}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Arquivar */}
      <Dialog
        open={!!eventoParaArquivar}
        onOpenChange={(open) => !open && setEventoParaArquivar(null)}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-500" />
              Arquivar Evento
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-neutral-300 leading-relaxed pt-2">
            Deseja arquivar o evento{' '}
            <strong className="text-white">"{eventoParaArquivar?.titulo}"</strong>? O evento deixará
            de aparecer publicamente na listagem ativa e sairá do destaque da home.
          </p>

          <DialogFooter className="pt-4 border-t border-neutral-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventoParaArquivar(null)}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={arquivando}
              onClick={handleConfirmarArquivar}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-2"
            >
              {arquivando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Arquivar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Exclusão */}
      <Dialog
        open={!!eventoParaExcluir}
        onOpenChange={(open) => !open && setEventoParaExcluir(null)}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Excluir Evento
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-neutral-300 leading-relaxed pt-2">
            Tem certeza de que deseja excluir definitivamente o evento{' '}
            <strong className="text-white">"{eventoParaExcluir?.titulo}"</strong>? Esta ação é
            irreversível e removerá a imagem e dados associados.
          </p>

          <DialogFooter className="pt-4 border-t border-neutral-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventoParaExcluir(null)}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={excluindo}
              onClick={handleConfirmarExcluir}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-2"
            >
              {excluindo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default AdminAgendaPage
