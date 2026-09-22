import React, { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { CardHome } from '@/lib/conteudo-padrao'
import { exportarParaCsv } from '@/lib/export-csv'
import { formatarDataHora } from '@/lib/timezone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap,
  MessageSquare,
  Folder,
  Calendar,
  Trophy,
  Heart,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Layers,
  ExternalLink,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Tag,
} from 'lucide-react'

// Mapeamento dos ícones permitidos
const ICON_MAP = {
  GraduationCap,
  MessageSquare,
  Folder,
  Calendar,
  Trophy,
  Heart,
}

type IconeType = keyof typeof ICON_MAP

interface CardFormState {
  id?: string
  titulo: string
  descricao: string
  icone: IconeType
  selo_texto: string
  selo_estilo: 'amarelo' | 'gradiente' | ''
  texto_botao: string
  link: string
  clicavel: boolean
  cor_icone: 'padrao' | 'dourado' | 'lilas'
  ordem: number
  status: 'rascunho' | 'publicado'
}

const INITIAL_CARD_FORM: CardFormState = {
  titulo: '',
  descricao: '',
  icone: 'GraduationCap',
  selo_texto: '',
  selo_estilo: '',
  texto_botao: 'Acessar',
  link: '',
  clicavel: true,
  cor_icone: 'padrao',
  ordem: 1,
  status: 'publicado',
}

export const AdminCardsPage: React.FC = () => {
  const [cards, setCards] = useState<CardHome[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formState, setFormState] = useState<CardFormState>(INITIAL_CARD_FORM)
  const [cardParaExcluir, setCardParaExcluir] = useState<CardHome | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const { toast } = useToast()

  const carregarCards = async () => {
    try {
      setCarregando(true)
      const data = await adminService.getCards()
      setCards(data)
    } catch (err) {
      toast({
        title: 'Erro ao carregar cards',
        description: 'Não foi possível carregar a lista de cards.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarCards()
  }, [])

  const handleAbrirCriacao = () => {
    const proximaOrdem = cards.length > 0 ? Math.max(...cards.map((c) => c.ordem || 0)) + 1 : 1
    setFormState({
      ...INITIAL_CARD_FORM,
      ordem: proximaOrdem,
    })
    setModalAberto(true)
  }

  const handleAbrirEdicao = (card: CardHome) => {
    setFormState({
      id: card.id,
      titulo: card.titulo || '',
      descricao: card.descricao || '',
      icone: (card.icone as IconeType) || 'GraduationCap',
      selo_texto: card.selo_texto || '',
      selo_estilo: card.selo_estilo || '',
      texto_botao: card.texto_botao || 'Acessar',
      link: card.link || '',
      clicavel: !!card.clicavel,
      cor_icone: card.cor_icone || 'padrao',
      ordem: card.ordem ?? 1,
      status: card.status || 'publicado',
    })
    setModalAberto(true)
  }

  const handleSalvarCard = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de URL
    if (formState.link && formState.link.trim() && formState.link !== '#') {
      try {
        new URL(formState.link.trim())
      } catch {
        toast({
          title: 'URL inválida',
          description: 'O link precisa ser uma URL válida (ex: https://dominio.com/pagina).',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setSalvando(true)
      const payload: Omit<CardHome, 'id'> = {
        titulo: formState.titulo.trim(),
        descricao: formState.descricao.trim(),
        icone: formState.icone,
        selo_texto: formState.selo_texto?.trim() || '',
        selo_estilo: formState.selo_estilo || '',
        texto_botao: formState.texto_botao.trim(),
        link: formState.link?.trim() || '',
        clicavel: !!formState.clicavel,
        cor_icone: formState.cor_icone,
        ordem: Number(formState.ordem) || 1,
        status: formState.status,
      }

      if (formState.id) {
        await adminService.updateCard(formState.id, payload)
        toast({
          title: 'Card atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        await adminService.createCard(payload)
        toast({
          title: 'Card criado!',
          description: 'O novo card foi adicionado à home.',
        })
      }

      setModalAberto(false)
      await carregarCards()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Falha ao gravar os dados do card.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleConfirmarExclusao = async () => {
    if (!cardParaExcluir) return
    try {
      setExcluindo(true)
      await adminService.deleteCard(cardParaExcluir.id)
      toast({
        title: 'Card excluído',
        description: `O card "${cardParaExcluir.titulo}" foi removido.`,
      })
      setCardParaExcluir(null)
      await carregarCards()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Não foi possível remover o card.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const handleExportarCsv = () => {
    if (cards.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há cards cadastrados para exportar.',
      })
      return
    }

    exportarParaCsv(
      'cards_home',
      [
        { header: 'Ordem', accessor: (c) => c.ordem },
        { header: 'Status', accessor: (c) => c.status },
        { header: 'Título', accessor: (c) => c.titulo },
        { header: 'Descrição', accessor: (c) => c.descricao },
        { header: 'Ícone', accessor: (c) => c.icone },
        { header: 'Cor do Ícone', accessor: (c) => c.cor_icone },
        { header: 'Selo Texto', accessor: (c) => c.selo_texto || '' },
        { header: 'Selo Estilo', accessor: (c) => c.selo_estilo || '' },
        { header: 'Texto do Botão', accessor: (c) => c.texto_botao },
        { header: 'Link', accessor: (c) => c.link || '' },
        { header: 'Clicável', accessor: (c) => (c.clicavel ? 'Sim' : 'Não') },
      ],
      cards,
    )

    toast({
      title: 'Planilha exportada',
      description: 'O arquivo CSV dos cards foi gerado com sucesso.',
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-red" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Cards da Página Inicial
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Organize a vitrine de acessos rápidos exibidos para os colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            disabled={carregando || cards.length === 0}
            className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 hover:text-white text-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar planilha (CSV)
          </Button>

          <Button
            size="sm"
            onClick={handleAbrirCriacao}
            className="bg-gradient-brand hover:opacity-95 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-red/10 border-0"
          >
            <Plus className="w-4 h-4" />
            Novo Card
          </Button>
        </div>
      </div>

      {/* Tabela de Cards */}
      {carregando ? (
        <div className="p-12 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Carregando cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <p className="text-sm text-neutral-400">Nenhum card cadastrado.</p>
          <Button
            size="sm"
            onClick={handleAbrirCriacao}
            className="mt-4 bg-gradient-brand text-white text-xs"
          >
            Criar Primeiro Card
          </Button>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-center w-16">Ordem</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ícone</th>
                  <th className="px-4 py-3">Título & Descrição</th>
                  <th className="px-4 py-3">Selo</th>
                  <th className="px-4 py-3">Botão & Link</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 text-neutral-300">
                {cards.map((card) => {
                  const IconComp = ICON_MAP[card.icone as IconeType] || Layers
                  const isPublicado = card.status === 'publicado'

                  return (
                    <tr key={card.id} className="hover:bg-neutral-900/50 transition duration-150">
                      {/* Ordem */}
                      <td className="px-4 py-3.5 text-center font-bold text-neutral-400">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 text-xs">
                          {card.ordem}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPublicado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Rascunho
                          </span>
                        )}
                      </td>

                      {/* Ícone */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            card.cor_icone === 'dourado'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : card.cor_icone === 'lilas'
                                ? 'bg-purple-500/10 text-brand-lilac border-purple-500/20'
                                : 'bg-neutral-800 text-neutral-200 border-neutral-700'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                      </td>

                      {/* Título & Descrição */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-semibold text-white text-xs">{card.titulo}</p>
                        <p className="text-neutral-400 text-[11px] line-clamp-1 mt-0.5">
                          {card.descricao}
                        </p>
                      </td>

                      {/* Selo */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {card.selo_texto ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              card.selo_estilo === 'amarelo'
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                : card.selo_estilo === 'gradiente'
                                  ? 'bg-gradient-brand text-white border-transparent'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                            }`}
                          >
                            {card.selo_texto}
                          </span>
                        ) : (
                          <span className="text-neutral-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Botão & Link */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-200 truncate">
                            {card.texto_botao}
                          </span>
                          {card.link && card.link !== '#' ? (
                            <a
                              href={card.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-brand-orange hover:underline truncate inline-flex items-center gap-1 mt-0.5"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              {card.link}
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-500">Sem link externo</span>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirEdicao(card)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800"
                            title="Editar Card"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCardParaExcluir(card)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                            title="Excluir Card"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Card */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-2xl max-h-[90vh] flex flex-col font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {formState.id ? 'Editar Card' : 'Novo Card da Home'}
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Preencha os campos abaixo. As alterações serão refletidas no site conforme o status.
            </DialogDescription>
          </DialogHeader>

          <form
            id="card-form"
            onSubmit={handleSalvarCard}
            className="flex-1 overflow-y-auto space-y-4 pr-1 py-2"
          >
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="titulo" className="text-xs font-medium text-neutral-300">
                Título do Card *
              </Label>
              <Input
                id="titulo"
                value={formState.titulo}
                onChange={(e) => setFormState({ ...formState, titulo: e.target.value })}
                required
                placeholder="Ex: Plataforma UniCredlar"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-medium text-neutral-300">
                Descrição Detalhada *
              </Label>
              <Textarea
                id="descricao"
                value={formState.descricao}
                onChange={(e) => setFormState({ ...formState, descricao: e.target.value })}
                required
                rows={3}
                placeholder="Ex: Acesse os cursos e trilhas de desenvolvimento..."
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs resize-none"
              />
            </div>

            {/* Ícone, Cor do Ícone e Ordem */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="icone" className="text-xs font-medium text-neutral-300">
                  Ícone *
                </Label>
                <Select
                  value={formState.icone}
                  onValueChange={(val: IconeType) => setFormState({ ...formState, icone: val })}
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs">
                    <SelectValue placeholder="Selecione o ícone" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="GraduationCap">GraduationCap (Educação)</SelectItem>
                    <SelectItem value="MessageSquare">MessageSquare (Comunicação)</SelectItem>
                    <SelectItem value="Folder">Folder (Arquivos/Drive)</SelectItem>
                    <SelectItem value="Calendar">Calendar (Agenda/Eventos)</SelectItem>
                    <SelectItem value="Trophy">Trophy (Hall da Fama)</SelectItem>
                    <SelectItem value="Heart">Heart (Cuidado/DHX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cor_icone" className="text-xs font-medium text-neutral-300">
                  Cor do Ícone
                </Label>
                <Select
                  value={formState.cor_icone}
                  onValueChange={(val: 'padrao' | 'dourado' | 'lilas') =>
                    setFormState({ ...formState, cor_icone: val })
                  }
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs">
                    <SelectValue placeholder="Cor do ícone" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="padrao">Padrão (Neutro)</SelectItem>
                    <SelectItem value="dourado">Dourado (Destaque)</SelectItem>
                    <SelectItem value="lilas">Lilás (Cuidado/DHX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ordem" className="text-xs font-medium text-neutral-300">
                  Ordem de Exibição
                </Label>
                <Input
                  id="ordem"
                  type="number"
                  min={1}
                  value={formState.ordem}
                  onChange={(e) => setFormState({ ...formState, ordem: Number(e.target.value) })}
                  className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                />
              </div>
            </div>

            {/* Selo (Badge) e Estilo do Selo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="selo_texto" className="text-xs font-medium text-neutral-300">
                  Texto do Selo (Badge Opcional)
                </Label>
                <Input
                  id="selo_texto"
                  value={formState.selo_texto}
                  onChange={(e) => setFormState({ ...formState, selo_texto: e.target.value })}
                  placeholder="Ex: Em Breve, Novidade"
                  className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="selo_estilo" className="text-xs font-medium text-neutral-300">
                  Estilo Visual do Selo
                </Label>
                <Select
                  value={formState.selo_estilo || 'none'}
                  onValueChange={(val: string) =>
                    setFormState({
                      ...formState,
                      selo_estilo: val === 'none' ? '' : (val as 'amarelo' | 'gradiente'),
                    })
                  }
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs">
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="none">Sem estilo especial</SelectItem>
                    <SelectItem value="amarelo">Amarelo Dourado</SelectItem>
                    <SelectItem value="gradiente">Gradiente da Marca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Texto do Botão e Link de Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="texto_botao" className="text-xs font-medium text-neutral-300">
                  Texto do Botão *
                </Label>
                <Input
                  id="texto_botao"
                  value={formState.texto_botao}
                  onChange={(e) => setFormState({ ...formState, texto_botao: e.target.value })}
                  required
                  placeholder="Ex: Acessar Plataforma, Aguarde"
                  className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link" className="text-xs font-medium text-neutral-300">
                  Link de Destino (URL Válida)
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={formState.link}
                  onChange={(e) => setFormState({ ...formState, link: e.target.value })}
                  placeholder="https://exemplo.com.br/pagina"
                  className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                />
              </div>
            </div>

            {/* Clicável & Status */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="clicavel"
                    className="text-xs font-medium text-neutral-200 cursor-pointer"
                  >
                    Card Clicável
                  </Label>
                  <p className="text-[11px] text-neutral-500">
                    Se desmarcado, o botão fica desabilitado
                  </p>
                </div>
                <Switch
                  id="clicavel"
                  checked={formState.clicavel}
                  onCheckedChange={(checked) => setFormState({ ...formState, clicavel: checked })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-medium text-neutral-300">
                  Status de Publicação *
                </Label>
                <Select
                  value={formState.status}
                  onValueChange={(val: 'rascunho' | 'publicado') =>
                    setFormState({ ...formState, status: val })
                  }
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="publicado">Publicado (Visível no site)</SelectItem>
                    <SelectItem value="rascunho">Rascunho (Oculto no site)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          <DialogFooter className="border-t border-neutral-800 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalAberto(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="card-form"
              disabled={salvando}
              className="bg-gradient-brand hover:opacity-95 text-white font-medium text-xs px-5 border-0"
            >
              {salvando ? 'Salvando...' : formState.id ? 'Salvar Alterações' : 'Criar Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog
        open={!!cardParaExcluir}
        onOpenChange={(open) => !open && setCardParaExcluir(null)}
      >
        <AlertDialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base">Excluir Card</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400 text-xs">
              Tem certeza que deseja excluir o card{' '}
              <strong className="text-white">"{cardParaExcluir?.titulo}"</strong>? Esta ação ficará
              registrada no histórico do painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={excluindo}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={handleConfirmarExclusao}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              {excluindo ? 'Excluindo...' : 'Sim, Excluir Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
