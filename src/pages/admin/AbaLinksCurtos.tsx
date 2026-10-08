import React, { useState, useEffect, useMemo } from 'react'
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  MousePointerClick,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { adminService, LinkCurtoItem, CliqueItem } from '@/services/adminService'
import { getUrlPublica } from '@/lib/conteudo-padrao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export const AbaLinksCurtos: React.FC = () => {
  const [links, setLinks] = useState<LinkCurtoItem[]>([])
  const [cliques, setCliques] = useState<CliqueItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  // Modal Criar/Editar
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [linkEditando, setLinkEditando] = useState<LinkCurtoItem | null>(null)
  const [formData, setFormData] = useState({
    apelido: '',
    destino: '',
    descricao: '',
    ativo: true,
  })

  // Modal Exclusão
  const [linkParaExcluir, setLinkParaExcluir] = useState<LinkCurtoItem | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const { toast } = useToast()

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [linksRes, cliquesRes] = await Promise.allSettled([
        adminService.getLinksCurtos(),
        adminService.getCliques(),
      ])

      if (linksRes.status === 'fulfilled') {
        setLinks(linksRes.value)
      }
      if (cliquesRes.status === 'fulfilled') {
        // Filtrar apenas cliques de link_curto
        setCliques(cliquesRes.value.filter((c) => c.tipo === 'link_curto'))
      }
    } catch {
      toast({
        title: 'Erro ao carregar links',
        description: 'Não foi possível buscar a lista de links curtos.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Contagem de cliques agrupada por alvo (apelido)
  const contagemCliquesPorApelido = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const c of cliques) {
      if (c.alvo) {
        const k = c.alvo.toLowerCase()
        mapa[k] = (mapa[k] || 0) + 1
      }
    }
    return mapa
  }, [cliques])

  const abrirNovo = () => {
    setLinkEditando(null)
    setFormData({
      apelido: '',
      destino: '',
      descricao: '',
      ativo: true,
    })
    setModalAberto(true)
  }

  const abrirEditar = (item: LinkCurtoItem) => {
    setLinkEditando(item)
    setFormData({
      apelido: item.apelido,
      destino: item.destino,
      descricao: item.descricao || '',
      ativo: item.ativo,
    })
    setModalAberto(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    const apelidoSanitizado = formData.apelido
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')

    if (!apelidoSanitizado) {
      toast({
        title: 'Apelido obrigatório',
        description: 'Informe um apelido contendo apenas letras minúsculas, números e hífens.',
        variant: 'destructive',
      })
      return
    }

    try {
      new URL(formData.destino.trim())
    } catch {
      toast({
        title: 'Destino inválido',
        description: 'Informe uma URL completa de destino (ex: https://...).',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)

      const payload = {
        apelido: apelidoSanitizado,
        destino: formData.destino.trim(),
        descricao: formData.descricao.trim(),
        ativo: formData.ativo,
      }

      if (linkEditando) {
        await adminService.updateLinkCurto(linkEditando.id, payload)
        toast({
          title: 'Link curto atualizado',
          description: `O link /r/${apelidoSanitizado} foi atualizado com sucesso.`,
        })
      } else {
        await adminService.createLinkCurto(payload)
        toast({
          title: 'Link curto criado',
          description: `O link /r/${apelidoSanitizado} já está disponível para uso.`,
        })
      }

      setModalAberto(false)
      carregarDados()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar link curto',
        description: err instanceof Error ? err.message : 'Verifique se o apelido já existe.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleToggleAtivo = async (item: LinkCurtoItem) => {
    try {
      const novoStatus = !item.ativo
      await adminService.updateLinkCurto(item.id, { ativo: novoStatus })
      setLinks((prev) => prev.map((l) => (l.id === item.id ? { ...l, ativo: novoStatus } : l)))
      toast({
        title: novoStatus ? 'Link ativado' : 'Link desativado',
        description: `O link /r/${item.apelido} foi ${novoStatus ? 'ativado' : 'desativado'}.`,
      })
    } catch {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível atualizar o estado do link.',
        variant: 'destructive',
      })
    }
  }

  const handleCopiarLink = async (item: LinkCurtoItem) => {
    const baseUrl = getUrlPublica().replace(/\/+$/, '')
    const urlCompleta = `${baseUrl}/r/${item.apelido}`

    try {
      await navigator.clipboard.writeText(urlCompleta)
      setCopiadoId(item.id)
      toast({
        title: 'Link copiado!',
        description: urlCompleta,
      })
      setTimeout(() => setCopiadoId(null), 3000)
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie manualmente: ' + urlCompleta,
        variant: 'destructive',
      })
    }
  }

  const handleConfirmarExcluir = async () => {
    if (!linkParaExcluir) return
    try {
      setExcluindo(true)
      await adminService.deleteLinkCurto(linkParaExcluir.id)
      toast({
        title: 'Link curto removido',
        description: `O apelido /r/${linkParaExcluir.apelido} foi excluído.`,
      })
      setLinkParaExcluir(null)
      carregarDados()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o link curto.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const linksFiltrados = useMemo(() => {
    if (!busca.trim()) return links
    const termo = busca.toLowerCase()
    return links.filter(
      (l) =>
        l.apelido.toLowerCase().includes(termo) ||
        l.destino.toLowerCase().includes(termo) ||
        (l.descricao && l.descricao.toLowerCase().includes(termo)),
    )
  }, [links, busca])

  return (
    <div className="space-y-6">
      {/* Topo da aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-brand-orange" />
            Links Curtos Rastreáveis
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Crie links amigáveis do formato <strong className="text-neutral-200">
              /r/apelido
            </strong>{' '}
            com contagem automática de cliques e telemetria.
          </p>
        </div>

        <Button
          onClick={abrirNovo}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs gap-1.5 rounded-xl shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Link Curto
        </Button>
      </div>

      {/* Barra de busca */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por apelido, destino ou descrição..."
          className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange text-xs"
        />
      </div>

      {/* Lista de Links */}
      {carregando ? (
        <div className="p-12 flex flex-col items-center justify-center text-neutral-400 gap-3 bg-neutral-900/40 rounded-2xl border border-neutral-800">
          <Loader2 className="w-7 h-7 text-brand-orange animate-spin" />
          <p className="text-xs">Carregando links curtos...</p>
        </div>
      ) : linksFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Nenhum link curto encontrado</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {busca
                ? 'Nenhum resultado corresponde à sua busca.'
                : 'Crie seu primeiro link curto clicando no botão acima.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {linksFiltrados.map((item) => {
            const clicks = contagemCliquesPorApelido[item.apelido.toLowerCase()] || 0
            const urlCompleta = `${getUrlPublica().replace(/\/+$/, '')}/r/${item.apelido}`

            return (
              <div
                key={item.id}
                className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-brand-orange text-sm bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">
                      /r/{item.apelido}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        item.ativo
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {item.ativo ? 'Ativo' : 'Desativado'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-300 bg-neutral-950 px-2.5 py-0.5 rounded-full border border-neutral-800">
                      <MousePointerClick className="w-3 h-3 text-brand-orange" />
                      {clicks} {clicks === 1 ? 'clique' : 'cliques'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 truncate font-mono text-[11px]">
                    <span className="text-neutral-500 font-sans">Destino: </span>
                    <a
                      href={item.destino}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-white"
                    >
                      {item.destino}
                    </a>
                  </p>

                  {item.descricao && (
                    <p className="text-xs text-neutral-400 line-clamp-1">{item.descricao}</p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopiarLink(item)}
                    className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-white text-xs gap-1.5 rounded-lg"
                    title={urlCompleta}
                  >
                    {copiadoId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copiar link</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAtivo(item)}
                    className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs rounded-lg"
                    title={item.ativo ? 'Desativar link' : 'Ativar link'}
                  >
                    {item.ativo ? 'Desativar' : 'Ativar'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirEditar(item)}
                    className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs rounded-lg p-2"
                    title="Editar link curto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkParaExcluir(item)}
                    className="border-neutral-800 bg-neutral-950 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-neutral-400 text-xs rounded-lg p-2"
                    title="Excluir link curto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-brand-orange" />
              {linkEditando ? 'Editar Link Curto' : 'Novo Link Curto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="apelido" className="text-xs font-medium text-neutral-300">
                Apelido da rota (somente letras minúsculas, números e hífen) *
              </Label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-neutral-950 border border-r-0 border-neutral-800 text-neutral-500 text-xs font-mono rounded-l-md select-none">
                  /r/
                </span>
                <Input
                  id="apelido"
                  value={formData.apelido}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      apelido: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  required
                  placeholder="exemplo-evento"
                  className="rounded-l-none bg-neutral-950 border-neutral-800 text-white font-mono text-xs focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destino" className="text-xs font-medium text-neutral-300">
                URL de Destino Completa *
              </Label>
              <Input
                id="destino"
                type="url"
                value={formData.destino}
                onChange={(e) => setFormData((prev) => ({ ...prev, destino: e.target.value }))}
                required
                placeholder="https://suaempresa.com.br/formulario-especial"
                className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-medium text-neutral-300">
                Descrição / Finalidade (opcional)
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Campanha de férias 2025 nos stories"
                className="bg-neutral-950 border-neutral-800 text-white text-xs focus:border-brand-orange"
              />
            </div>

            <div className="flex items-center justify-between pt-2 pb-1">
              <div>
                <Label
                  htmlFor="ativo"
                  className="text-xs font-medium text-neutral-300 cursor-pointer"
                >
                  Link ativo para redirecionamento
                </Label>
                <p className="text-[11px] text-neutral-500">
                  Quando desativado, exibe aviso amigável ao usuário.
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
              />
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
                {linkEditando ? 'Salvar Alterações' : 'Criar Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Exclusão */}
      <Dialog open={!!linkParaExcluir} onOpenChange={(open) => !open && setLinkParaExcluir(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Excluir Link Curto
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-neutral-300 leading-relaxed pt-2">
            Tem certeza de que deseja remover o link curto{' '}
            <strong className="text-white font-mono">/r/{linkParaExcluir?.apelido}</strong>? Quem
            acessar esta rota passará a ver uma mensagem de link indisponível.
          </p>

          <DialogFooter className="pt-4 border-t border-neutral-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkParaExcluir(null)}
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
export default AbaLinksCurtos
