import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Link2,
  Share2,
  Trash2,
  Edit2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Camera,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  LiderItem,
  LiderStatus,
  ConsentimentoItem,
  TermoItem,
} from '@/services/adminService'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { useToast } from '@/hooks/use-toast'
import { getUrlPublica } from '@/lib/conteudo-padrao'
import { exportarParaCsv } from '@/lib/export-csv'
import { formatarDataHora, formatarApenasData } from '@/lib/timezone'
import pb from '@/lib/pocketbase/client'

export const AdminLideresPage: React.FC = () => {
  const { usuario } = useAdminAuth()
  const { config } = useConteudoSite()
  const { toast } = useToast()

  const [lideres, setLideres] = useState<LiderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [termoVigente, setTermoVigente] = useState<TermoItem | null>(null)

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Modais de Criação / Edição
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [editandoLider, setEditandoLider] = useState<LiderItem | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formArea, setFormArea] = useState('')
  const [salvandoForm, setSalvandoForm] = useState(false)

  // Modal Exclusão
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false)
  const [liderParaExcluir, setLiderParaExcluir] = useState<LiderItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Ficha do Líder / Drawer de Detalhes
  const [liderSelecionado, setLiderSelecionado] = useState<LiderItem | null>(null)
  const [consentimentosLider, setConsentimentosLider] = useState<ConsentimentoItem[]>([])
  const [loadingConsentimentos, setLoadingConsentimentos] = useState(false)

  // Modal Convite Gerado
  const [modalConviteOpen, setModalConviteOpen] = useState(false)
  const [conviteGeradoInfo, setConviteGeradoInfo] = useState<{
    liderNome: string
    linkCompleto: string
    validadeFormatada: string
    mensagemWhatsApp: string
  } | null>(null)
  const [gerandoConviteId, setGerandoConviteId] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [msgCopiada, setMsgCopiada] = useState(false)

  // Modal Revogação Painel
  const [modalRevogarPainelOpen, setModalRevogarPainelOpen] = useState(false)
  const [liderParaRevogar, setLiderParaRevogar] = useState<LiderItem | null>(null)
  const [revogando, setRevogando] = useState(false)

  const isAdmin = usuario?.papel === 'admin'

  // Carregar dados
  const carregarDados = async () => {
    try {
      setLoading(true)
      const [listaLideres, termoUso] = await Promise.all([
        adminService.getLideres(),
        adminService.getTermoVigente('uso_imagem'),
      ])
      setLideres(listaLideres)
      setTermoVigente(termoUso)
    } catch {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a lista de líderes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Carregar histórico de consentimentos quando abrir a ficha
  const abrirFichaLider = async (lider: LiderItem) => {
    setLiderSelecionado(lider)
    setLoadingConsentimentos(true)
    try {
      const historico = await adminService.getConsentimentosLider(lider.id)
      setConsentimentosLider(historico)
    } catch {
      toast({
        title: 'Erro ao buscar consentimentos',
        description: 'Não foi possível buscar o histórico deste líder.',
        variant: 'destructive',
      })
    } finally {
      setLoadingConsentimentos(false)
    }
  }

  // Filtragem da lista
  const lideresFiltrados = useMemo(() => {
    return lideres.filter((l) => {
      const matchesBusca =
        l.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (l.nome_exibicao && l.nome_exibicao.toLowerCase().includes(busca.toLowerCase())) ||
        (l.area && l.area.toLowerCase().includes(busca.toLowerCase()))

      const matchesStatus = filtroStatus === 'todos' || l.status === filtroStatus

      return matchesBusca && matchesStatus
    })
  }, [lideres, busca, filtroStatus])

  // Submissão Criar / Editar Líder
  const handleSalvarLider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome completo do líder.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoForm(true)
    try {
      if (editandoLider) {
        const atualizado = await adminService.updateLider(editandoLider.id, {
          nome: formNome.trim(),
          area: formArea.trim() || undefined,
        })
        setLideres((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)))
        if (liderSelecionado?.id === atualizado.id) {
          setLiderSelecionado(atualizado)
        }
        toast({ title: 'Líder atualizado com sucesso.' })
      } else {
        const novo = await adminService.createLider({
          nome: formNome.trim(),
          area: formArea.trim() || undefined,
        })
        setLideres((prev) => [novo, ...prev])
        toast({ title: 'Líder cadastrado com sucesso.' })
      }
      setModalFormOpen(false)
    } catch (err: unknown) {
      const pbErr = err as { message?: string }
      toast({
        title: 'Erro ao salvar',
        description: pbErr?.message || 'Falha ao salvar líder.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoForm(false)
    }
  }

  // Abrir Modal Criar
  const handleNovoLider = () => {
    setEditandoLider(null)
    setFormNome('')
    setFormArea('')
    setModalFormOpen(true)
  }

  // Abrir Modal Editar
  const handleEditarLider = (lider: LiderItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditandoLider(lider)
    setFormNome(lider.nome)
    setFormArea(lider.area || '')
    setModalFormOpen(true)
  }

  // Excluir Líder (apenas pendente)
  const handleConfirmarExclusao = async () => {
    if (!liderParaExcluir) return
    setExcluindo(true)
    try {
      await adminService.deleteLider(liderParaExcluir.id)
      setLideres((prev) => prev.filter((l) => l.id !== liderParaExcluir.id))
      if (liderSelecionado?.id === liderParaExcluir.id) {
        setLiderSelecionado(null)
      }
      toast({ title: 'Líder removido com sucesso.' })
      setModalExcluirOpen(false)
    } catch (err: unknown) {
      const pbErr = err as { message?: string }
      toast({
        title: 'Erro ao excluir',
        description: pbErr?.message || 'Apenas líderes com status pendente podem ser excluídos.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Gerar Convite
  const handleGerarConvite = async (lider: LiderItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    if (!termoVigente) {
      toast({
        title: 'Termo não cadastrado',
        description:
          'Cadastre e torne vigente um termo de uso de imagem em Configurações antes de convidar.',
        variant: 'destructive',
      })
      return
    }

    setGerandoConviteId(lider.id)
    try {
      const convite = await adminService.gerarConviteLider(lider.id)

      // Atualizar lista local
      setLideres((prev) =>
        prev.map((l) =>
          l.id === lider.id
            ? { ...l, status: 'convidado', convite_expira_em: convite.expira_em }
            : l,
        ),
      )
      if (liderSelecionado?.id === lider.id) {
        setLiderSelecionado((prev) =>
          prev ? { ...prev, status: 'convidado', convite_expira_em: convite.expira_em } : null,
        )
      }

      // Montar link completo baseado no endereço público configurado ou na URL atual
      const baseUrl = getUrlPublica(config?.url_publica)
      const linkCompleto = `${baseUrl}${convite.link}`

      // Formatar validade no fuso configurado
      const validadeFormatada = formatarApenasData(convite.expira_em)

      // Substituir variáveis no modelo de mensagem
      const templateMsg =
        config?.mensagem_convite ||
        'Olá, {nome}! Você foi convidado(a) para o Hall da Fama da UniCredlar. Para completar seu cadastro e autorizar o uso da sua foto, acesse: {link} (válido até {validade}).'

      const msgFinal = templateMsg
        .replace(/{nome}/g, lider.nome_exibicao || lider.nome)
        .replace(/{link}/g, linkCompleto)
        .replace(/{validade}/g, validadeFormatada)

      setConviteGeradoInfo({
        liderNome: lider.nome,
        linkCompleto,
        validadeFormatada,
        mensagemWhatsApp: msgFinal,
      })
      setLinkCopiado(false)
      setMsgCopiada(false)
      setModalConviteOpen(true)
    } catch (err: unknown) {
      const pbErr = err as { data?: { message?: string }; message?: string }
      toast({
        title: 'Não foi possível gerar convite',
        description: pbErr?.data?.message || pbErr?.message || 'Falha na requisição do servidor.',
        variant: 'destructive',
      })
    } finally {
      setGerandoConviteId(null)
    }
  }

  // Revogar pelo Painel
  const handleConfirmarRevogacaoPainel = async () => {
    if (!liderParaRevogar) return
    setRevogando(true)
    try {
      await adminService.revogarLiderPeloPainel(liderParaRevogar.id)

      setLideres((prev) =>
        prev.map((l) =>
          l.id === liderParaRevogar.id ? { ...l, status: 'revogado', foto: '' } : l,
        ),
      )
      if (liderSelecionado?.id === liderParaRevogar.id) {
        setLiderSelecionado((prev) => (prev ? { ...prev, status: 'revogado', foto: '' } : null))
        // Atualizar lista de consentimentos
        const novoHist = await adminService.getConsentimentosLider(liderParaRevogar.id)
        setConsentimentosLider(novoHist)
      }

      toast({
        title: 'Autorização revogada',
        description: 'A autorização foi revogada pelo painel e a foto foi apagada.',
      })
      setModalRevogarPainelOpen(false)
    } catch (err: unknown) {
      const pbErr = err as { data?: { message?: string }; message?: string }
      toast({
        title: 'Erro ao revogar',
        description: pbErr?.data?.message || pbErr?.message || 'Não foi possível revogar.',
        variant: 'destructive',
      })
    } finally {
      setRevogando(false)
    }
  }

  // Copiar Link
  const handleCopiarLink = () => {
    if (!conviteGeradoInfo) return
    navigator.clipboard.writeText(conviteGeradoInfo.linkCompleto)
    setLinkCopiado(true)
    toast({ title: 'Link copiado para a área de transferência!' })
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  // Copiar WhatsApp
  const handleCopiarWhatsApp = () => {
    if (!conviteGeradoInfo) return
    navigator.clipboard.writeText(conviteGeradoInfo.mensagemWhatsApp)
    setMsgCopiada(true)
    toast({ title: 'Mensagem formatada copiada para o WhatsApp!' })
    setTimeout(() => setMsgCopiada(false), 2500)
  }

  // Exportar Planilha (CSV) SEM o token
  const handleExportarCsv = () => {
    if (lideresFiltrados.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há registros para exportar com os filtros atuais.',
      })
      return
    }

    exportarParaCsv(
      'lideres_credlar',
      [
        { header: 'Nome Completo', accessor: (l) => l.nome },
        { header: 'Nome de Exibição', accessor: (l) => l.nome_exibicao || '' },
        { header: 'Área', accessor: (l) => l.area || '' },
        {
          header: 'Data de Admissão',
          accessor: (l) => (l.data_admissao ? formatarApenasData(l.data_admissao) : ''),
        },
        { header: 'Status', accessor: (l) => l.status },
        {
          header: 'Validade do Convite',
          accessor: (l) => (l.convite_expira_em ? formatarApenasData(l.convite_expira_em) : ''),
        },
        {
          header: 'Data de Cadastro',
          accessor: (l) => formatarDataHora(l.created),
        },
        {
          header: 'Última Atualização',
          accessor: (l) => formatarDataHora(l.updated),
        },
      ],
      lideresFiltrados,
    )

    toast({
      title: 'Planilha exportada com sucesso',
      description: 'O arquivo CSV foi baixado sem expor tokens de segurança.',
    })
  }

  // Badge de Status Colorido
  const renderStatusBadge = (status: LiderStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge
            variant="outline"
            className="bg-neutral-800 text-neutral-300 border-neutral-700 text-[11px]"
          >
            Pendente
          </Badge>
        )
      case 'convidado':
        return (
          <Badge
            variant="outline"
            className="bg-amber-950/40 text-amber-400 border-amber-800/60 text-[11px]"
          >
            Convidado
          </Badge>
        )
      case 'autorizado':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-950/40 text-emerald-400 border-emerald-800/60 text-[11px]"
          >
            Autorizado
          </Badge>
        )
      case 'recusado':
        return (
          <Badge
            variant="outline"
            className="bg-rose-950/40 text-rose-400 border-rose-800/60 text-[11px]"
          >
            Recusado
          </Badge>
        )
      case 'revogado':
        return (
          <Badge
            variant="outline"
            className="bg-red-950/50 text-red-500 border-red-900/60 text-[11px]"
          >
            Revogado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Gestão de Líderes
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-medium">
              Etapa 1D
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Convites individuais e autorizações de uso de imagem para o Hall da Fama com valor de
            prova.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            disabled={loading || lideresFiltrados.length === 0}
            className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 hover:text-white text-xs h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar planilha
          </Button>

          <Button
            onClick={handleNovoLider}
            size="sm"
            className="bg-gradient-brand hover:opacity-90 text-white text-xs h-9 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Líder
          </Button>
        </div>
      </div>

      {/* Aviso se não houver termo de uso de imagem vigente */}
      {!loading && !termoVigente && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Atenção:</strong> Não há termo de uso de imagem vigente no momento. Novos
              convites estão desabilitados até a ativação de um termo.
            </span>
          </div>
          {isAdmin && (
            <Link
              to="/admin/configuracoes"
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium whitespace-nowrap transition flex items-center gap-1 shrink-0"
            >
              <span>Ir para Configurações</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, exibição ou área..."
            className="pl-9 h-10 text-xs bg-neutral-900/60 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:border-brand-orange"
          />
        </div>

        <div className="w-full sm:w-56 shrink-0">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-10 text-xs bg-neutral-900/60 border-neutral-800 text-neutral-200">
              <Filter className="w-3.5 h-3.5 mr-2 text-neutral-300" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="convidado">Convidado</SelectItem>
              <SelectItem value="autorizado">Autorizado</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
              <SelectItem value="revogado">Revogado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Líderes */}
      <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-neutral-950/60 shadow-subtle">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <div className="w-7 h-7 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Carregando quadro de líderes...</p>
          </div>
        ) : lideresFiltrados.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm font-medium">Nenhum líder encontrado.</p>
            <p className="text-xs">
              {busca || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros ou a busca digitada.'
                : 'Cadastre o primeiro líder clicando no botão "Novo Líder".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Líder</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Validade Convite</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {lideresFiltrados.map((lider) => {
                  const fotoUrl =
                    lider.foto &&
                    pb.files.getURL(lider as unknown as Record<string, unknown>, lider.foto, {
                      thumb: '100x100',
                    })

                  return (
                    <tr
                      key={lider.id}
                      onClick={() => abrirFichaLider(lider)}
                      className="hover:bg-neutral-900/50 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/80 overflow-hidden flex items-center justify-center shrink-0">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={lider.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-4 h-4 text-neutral-500" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-neutral-200 group-hover:text-white truncate">
                              {lider.nome}
                            </p>
                            {lider.nome_exibicao && lider.nome_exibicao !== lider.nome && (
                              <p className="text-[11px] text-neutral-400 truncate">
                                Como: {lider.nome_exibicao}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-neutral-300">
                        {lider.area || <span className="text-neutral-500 italic">—</span>}
                      </td>

                      <td className="px-4 py-3">{renderStatusBadge(lider.status)}</td>

                      <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                        {lider.convite_expira_em ? (
                          formatarApenasData(lider.convite_expira_em)
                        ) : (
                          <span className="text-neutral-500 italic">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Botão Gerar / Reenviar Convite (esconder se já autorizado) */}
                          {lider.status !== 'autorizado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleGerarConvite(lider, e)}
                              disabled={!termoVigente || gerandoConviteId === lider.id}
                              className="h-8 px-2.5 text-xs text-brand-orange hover:text-white hover:bg-brand-orange/20"
                              title={
                                !termoVigente
                                  ? 'Cadastre e torne vigente um termo de uso de imagem em Configurações antes de convidar.'
                                  : lider.status === 'convidado'
                                    ? 'Gerar novo convite (substitui o anterior)'
                                    : 'Gerar convite de autorização'
                              }
                            >
                              <Link2 className="w-3.5 h-3.5 mr-1" />
                              {lider.status === 'convidado' ? 'Reenviar' : 'Convite'}
                            </Button>
                          )}

                          {/* Editar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditarLider(lider, e)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800"
                            title="Editar dados básicos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Excluir (apenas pendente) */}
                          {lider.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLiderParaExcluir(lider)
                                setModalExcluirOpen(true)
                              }}
                              className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                              title="Excluir líder pendente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Modal Criar / Editar Líder */}
      <Dialog open={modalFormOpen} onOpenChange={setModalFormOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editandoLider ? 'Editar Líder' : 'Novo Líder'}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Cadastre o nome completo e o setor do líder. Os demais campos serão preenchidos pelo
              próprio líder via link de convite.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarLider} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Nome Completo <span className="text-red-400">*</span>
              </label>
              <Input
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
                placeholder="Ex.: Maria de Oliveira"
                className="h-9 text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Área / Setor</label>
              <Input
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
                placeholder="Ex.: Comercial / Sala de Vendas"
                className="h-9 text-xs bg-neutral-950 border-neutral-800 text-neutral-200"
              />
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalFormOpen(false)}
                disabled={salvandoForm}
                className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoForm}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white text-xs"
              >
                {salvandoForm ? 'Salvando...' : 'Salvar Líder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Convite Gerado com Opções de Copiar */}
      <Dialog open={modalConviteOpen} onOpenChange={setModalConviteOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange shrink-0" />
              <DialogTitle className="text-base sm:text-lg font-bold text-white">
                Convite Gerado com Sucesso
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-400 pt-1">
              Convite exclusivo para <strong>{conviteGeradoInfo?.liderNome}</strong> com validade
              até {conviteGeradoInfo?.validadeFormatada}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 w-full min-w-0">
            {/* Campo Link Completo */}
            <div className="space-y-1.5 w-full min-w-0">
              <label className="text-xs font-medium text-neutral-300">Link direto de acesso</label>
              <div className="flex items-center gap-2 w-full min-w-0">
                <Input
                  readOnly
                  value={conviteGeradoInfo?.linkCompleto || ''}
                  className="flex-1 min-w-0 h-9 text-xs font-mono bg-neutral-950 border-neutral-800 text-neutral-200 select-all truncate"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopiarLink}
                  className="shrink-0 border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white hover:text-white text-xs font-medium transition"
                >
                  {linkCopiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      <span className="text-emerald-300">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1 text-neutral-300" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Mensagem Formatada para WhatsApp */}
            <div className="space-y-1.5 w-full min-w-0">
              <label className="text-xs font-medium text-neutral-300">
                Mensagem formatada para WhatsApp
              </label>
              <div className="w-full min-w-0 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto overflow-x-hidden font-sans">
                {conviteGeradoInfo?.mensagemWhatsApp}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between flex-col sm:flex-row pt-2 border-t border-neutral-800/80">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalConviteOpen(false)}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handleCopiarWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {msgCopiada ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Mensagem Copiada!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Copiar mensagem para WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ficha do Líder com Histórico de Consentimentos */}
      <Dialog
        open={!!liderSelecionado}
        onOpenChange={(open) => {
          if (!open) setLiderSelecionado(null)
        }}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>Ficha do Líder: {liderSelecionado?.nome}</span>
              </DialogTitle>
              {liderSelecionado && renderStatusBadge(liderSelecionado.status)}
            </div>
            <DialogDescription className="text-xs text-neutral-400">
              Dados cadastrais, foto enviada e histórico auditável de consentimentos.
            </DialogDescription>
          </DialogHeader>

          {liderSelecionado && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 mt-2">
              {/* Informações Básicas e Foto */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                <div className="w-24 h-24 rounded-xl bg-neutral-800 border-2 border-neutral-700/80 overflow-hidden flex items-center justify-center shrink-0">
                  {liderSelecionado.foto ? (
                    <img
                      src={pb.files.getURL(
                        liderSelecionado as unknown as Record<string, unknown>,
                        liderSelecionado.foto,
                        { thumb: '300x300' },
                      )}
                      alt={liderSelecionado.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                      <Camera className="w-6 h-6" />
                      <span>Sem foto</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <h2 className="text-base font-bold text-white">{liderSelecionado.nome}</h2>
                  <p className="text-xs text-neutral-400">
                    <strong>Nome exibido:</strong>{' '}
                    {liderSelecionado.nome_exibicao || liderSelecionado.nome}
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Área:</strong> {liderSelecionado.area || 'Não informada'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    <strong>Data de Admissão:</strong>{' '}
                    {liderSelecionado.data_admissao
                      ? formatarApenasData(liderSelecionado.data_admissao)
                      : 'Não informada'}
                  </p>
                  {liderSelecionado.convite_expira_em && (
                    <p className="text-xs text-neutral-400">
                      <strong>Validade do Convite:</strong>{' '}
                      {formatarApenasData(liderSelecionado.convite_expira_em)}
                    </p>
                  )}
                </div>

                {/* Ações na Ficha */}
                <div className="flex flex-col gap-2 shrink-0">
                  {liderSelecionado.status !== 'autorizado' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleGerarConvite(liderSelecionado, e)}
                      disabled={!termoVigente || gerandoConviteId === liderSelecionado.id}
                      className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 hover:text-white text-xs"
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1 text-brand-orange" />
                      Gerar Novo Convite
                    </Button>
                  )}

                  {liderSelecionado.status === 'autorizado' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLiderParaRevogar(liderSelecionado)
                        setModalRevogarPainelOpen(true)
                      }}
                      className="border-red-700/80 bg-red-950/40 text-red-300 hover:bg-red-900/40 hover:text-red-200 text-xs"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      Registrar revogação
                    </Button>
                  )}
                </div>
              </div>

              {/* Histórico de Consentimentos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-orange" />
                  <h3 className="text-sm font-bold text-white">Histórico de Consentimentos</h3>
                </div>

                {loadingConsentimentos ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    Carregando histórico...
                  </div>
                ) : consentimentosLider.length === 0 ? (
                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-500 text-center">
                    Nenhum registro de consentimento para este líder até o momento.
                  </div>
                ) : (
                  <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/70 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                        <tr>
                          <th className="px-3 py-2.5">Data / Hora</th>
                          <th className="px-3 py-2.5">Ação</th>
                          <th className="px-3 py-2.5">Origem</th>
                          <th className="px-3 py-2.5">Versão Termo</th>
                          <th className="px-3 py-2.5">Registrado Por</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 font-sans">
                        {consentimentosLider.map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-900/40">
                            <td className="px-3 py-2 text-neutral-400">
                              {formatarDataHora(c.created)}
                            </td>
                            <td className="px-3 py-2">
                              {c.acao === 'aceite' && (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Aceite
                                </span>
                              )}
                              {c.acao === 'recusa' && (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Recusa
                                </span>
                              )}
                              {c.acao === 'revogacao' && (
                                <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Revogação
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-neutral-300 uppercase text-[11px]">
                              {c.origem}
                            </td>
                            <td className="px-3 py-2 text-neutral-400">
                              {c.versao_termo ? `v${c.versao_termo}` : '—'}
                            </td>
                            <td className="px-3 py-2 text-neutral-300 font-mono text-[11px] truncate max-w-[150px]">
                              {c.registrado_por}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLiderSelecionado(null)}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Fechar Ficha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Exclusão de Líder Pendente */}
      <Dialog open={modalExcluirOpen} onOpenChange={setModalExcluirOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500">Excluir Líder</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 pt-1">
              Tem certeza que deseja excluir o líder <strong>{liderParaExcluir?.nome}</strong>? Esta
              ação só é permitida para líderes com status pendente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalExcluirOpen(false)}
              disabled={excluindo}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="text-xs"
            >
              {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Revogação pelo Painel */}
      <Dialog open={modalRevogarPainelOpen} onOpenChange={setModalRevogarPainelOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500">
              Registrar Revogação de Autorização
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 pt-1 leading-relaxed">
              Esta ação registra que o líder <strong>{liderParaRevogar?.nome}</strong> solicitou o
              cancelamento de sua autorização (por exemplo, via e-mail ou DHO). A foto será{' '}
              <strong>apagada imediatamente</strong> e o status alterado para revogado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRevogarPainelOpen(false)}
              disabled={revogando}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmarRevogacaoPainel}
              disabled={revogando}
              className="text-xs"
            >
              {revogando ? 'Revogando...' : 'Confirmar Revogação no Painel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminLideresPage
