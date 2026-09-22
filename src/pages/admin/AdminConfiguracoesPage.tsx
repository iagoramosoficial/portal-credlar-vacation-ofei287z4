import React, { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { adminService, ParametrosApp, TermoItem } from '@/services/adminService'
import { ConfiguracoesSite, CONFIGURACOES_PADRAO, CORES_PADRAO_HEX } from '@/lib/conteudo-padrao'
import { formatarDataHora, setAppTimezone } from '@/lib/timezone'
import { aplicarCoresCss } from '@/lib/theme'
import { pb } from '@/lib/pocketbase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useToast } from '@/hooks/use-toast'
import {
  Sliders,
  Palette,
  Settings,
  FileText,
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  Plus,
  Shield,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Search,
} from 'lucide-react'
import { TermoConteudo } from '@/components/TermoConteudo'

// Fusos Horários do Brasil + Portugal
const FUSOS_HORARIOS = [
  { value: 'America/Sao_Paulo', label: 'Brasília / Sudeste / Sul / Goiás (UTC-3)' },
  { value: 'America/Bahia', label: 'Nordeste - Bahia / Salvador (UTC-3)' },
  { value: 'America/Recife', label: 'Nordeste - Pernambuco / Recife (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Nordeste - Ceará / Fortaleza (UTC-3)' },
  { value: 'America/Belem', label: 'Norte - Pará / Belém (UTC-3)' },
  { value: 'America/Manaus', label: 'Norte - Amazonas / Manaus (UTC-4)' },
  { value: 'America/Cuiaba', label: 'Centro-Oeste - Cuiabá (UTC-4)' },
  { value: 'America/Campo_Grande', label: 'Centro-Oeste - Campo Grande (UTC-4)' },
  { value: 'America/Porto_Velho', label: 'Norte - Rondônia / Porto Velho (UTC-4)' },
  { value: 'America/Boa_Vista', label: 'Norte - Roraima / Boa Vista (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Norte - Acre / Rio Branco (UTC-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
  { value: 'Europe/Lisbon', label: 'Portugal - Lisboa / Continental (WET/WEST)' },
  { value: 'Atlantic/Madeira', label: 'Portugal - Ilha da Madeira (WET/WEST)' },
  { value: 'Atlantic/Azores', label: 'Portugal - Ilhas dos Açores (AZOT/AZOST)' },
]

export const AdminConfiguracoesPage: React.FC = () => {
  const { usuario } = useAdminAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'marca' | 'parametros' | 'termos'>('marca')

  // --- Estado Aba Marca ---
  const [configId, setConfigId] = useState<string>('')
  const [marcaData, setMarcaData] = useState<ConfiguracoesSite>(CONFIGURACOES_PADRAO)
  const [logoPrincipalFile, setLogoPrincipalFile] = useState<File | null>(null)
  const [logoPrincipalPreview, setLogoPrincipalPreview] = useState<string>('')
  const [logoSecundarioFile, setLogoSecundarioFile] = useState<File | null>(null)
  const [logoSecundarioPreview, setLogoSecundarioPreview] = useState<string>('')
  const [salvandoMarca, setSalvandoMarca] = useState(false)

  // --- Estado Aba Parâmetros ---
  const [paramId, setParamId] = useState<string>('')
  const [paramData, setParamData] = useState<Partial<ParametrosApp>>({
    dias_alerta_sugestao: 7,
    dias_pesquisa_aberta: 7,
    dias_validade_homenagem: 30,
    email_remetente_nome: '',
    email_remetente: '',
  })
  const [fusoSelecionado, setFusoSelecionado] = useState<string>('America/Sao_Paulo')
  const [salvandoParams, setSalvandoParams] = useState(false)

  // --- Estado Aba Termos ---
  const [termos, setTermos] = useState<TermoItem[]>([])
  const [filtroTipoTermo, setFiltroTipoTermo] = useState<'todos' | 'uso_imagem' | 'privacidade'>(
    'todos',
  )
  const [modalNovoTermoOpen, setModalNovoTermoOpen] = useState(false)
  const [tipoNovoTermo, setTipoNovoTermo] = useState<'uso_imagem' | 'privacidade'>('privacidade')
  const [tituloNovoTermo, setTituloNovoTermo] = useState('')
  const [conteudoNovoTermo, setConteudoNovoTermo] = useState('')
  const [proximaVersao, setProximaVersao] = useState<number>(1)
  const [salvandoNovoTermo, setSalvandoNovoTermo] = useState(false)

  // Modal Visualizar Termo
  const [termoParaVisualizar, setTermoParaVisualizar] = useState<TermoItem | null>(null)
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false)

  // Modal Tornar Vigente
  const [modalVigenteOpen, setModalVigenteOpen] = useState(false)
  const [termoParaVigente, setTermoParaVigente] = useState<TermoItem | null>(null)
  const [atualizandoVigente, setAtualizandoVigente] = useState(false)

  // Loading geral
  const [carregando, setCarregando] = useState(true)

  // Ref para textarea do editor simples
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Carregar todos os dados iniciais
  useEffect(() => {
    let isMounted = true

    async function carregarTudo() {
      try {
        setCarregando(true)
        const [configRes, paramsRes, termosRes] = await Promise.allSettled([
          adminService.getConfiguracoes(),
          adminService.getParametros(),
          adminService.getTermos(),
        ])

        if (!isMounted) return

        if (configRes.status === 'fulfilled' && configRes.value) {
          const cfg = configRes.value
          setConfigId(cfg.id)
          setMarcaData(cfg)
          setFusoSelecionado(cfg.fuso_horario || 'America/Sao_Paulo')
          if (cfg.logo_principal) {
            setLogoPrincipalPreview(pb.files.getURL(cfg, cfg.logo_principal))
          }
          if (cfg.logo_secundario) {
            setLogoSecundarioPreview(pb.files.getURL(cfg, cfg.logo_secundario))
          }
        }

        if (paramsRes.status === 'fulfilled' && paramsRes.value) {
          const p = paramsRes.value
          setParamId(p.id)
          setParamData({
            dias_alerta_sugestao: p.dias_alerta_sugestao ?? 7,
            dias_pesquisa_aberta: p.dias_pesquisa_aberta ?? 7,
            dias_validade_homenagem: p.dias_validade_homenagem ?? 30,
            email_remetente_nome: p.email_remetente_nome ?? '',
            email_remetente: p.email_remetente ?? '',
          })
        }

        if (termosRes.status === 'fulfilled' && termosRes.value) {
          setTermos(termosRes.value)
        }
      } catch (err) {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível buscar as configurações completas.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setCarregando(false)
      }
    }

    carregarTudo()

    return () => {
      isMounted = false
    }
  }, [toast])

  // --- Handlers Aba Marca ---
  const handleLogoPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O logotipo principal deve ter no máximo 2 MB.',
        variant: 'destructive',
      })
      return
    }
    setLogoPrincipalFile(file)
    setLogoPrincipalPreview(URL.createObjectURL(file))
  }

  const handleLogoSecundarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O logotipo secundário deve ter no máximo 2 MB.',
        variant: 'destructive',
      })
      return
    }
    setLogoSecundarioFile(file)
    setLogoSecundarioPreview(URL.createObjectURL(file))
  }

  const handleRestaurarCoresPadrao = () => {
    setMarcaData((prev) => ({
      ...prev,
      ...CORES_PADRAO_HEX,
    }))
    aplicarCoresCss(CORES_PADRAO_HEX)
    toast({
      title: 'Cores padrão restauradas no formulário',
      description: 'Clique em "Salvar Marca" para persistir as alterações.',
    })
  }

  const handleSalvarMarca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configId) return

    try {
      setSalvandoMarca(true)
      const formData = new FormData()
      formData.append('nome_empresa', marcaData.nome_empresa || '')
      formData.append('titulo_pagina', marcaData.titulo_pagina || '')
      formData.append('url_publica', marcaData.url_publica || '')
      formData.append('cor_primaria', marcaData.cor_primaria || '#CC1F1F')
      formData.append('cor_secundaria', marcaData.cor_secundaria || '#E85C1A')
      formData.append('cor_destaque', marcaData.cor_destaque || '#F5A623')
      formData.append('cor_lilas', marcaData.cor_lilas || '#9B5FC0')
      formData.append('cor_dourado', marcaData.cor_dourado || '#FFD700')
      formData.append('cor_fundo_escuro', marcaData.cor_fundo_escuro || '#0A0A0A')
      formData.append('cor_fundo_gradiente', marcaData.cor_fundo_gradiente || '#8B0000')
      formData.append('cor_fundo_claro', marcaData.cor_fundo_claro || '#FAFAFA')

      if (logoPrincipalFile) {
        formData.append('logo_principal', logoPrincipalFile)
      }
      if (logoSecundarioFile) {
        formData.append('logo_secundario', logoSecundarioFile)
      }

      const res = await adminService.updateConfiguracoes(configId, formData)
      setMarcaData(res)
      if (res.logo_principal) {
        setLogoPrincipalPreview(pb.files.getURL(res, res.logo_principal))
      }
      if (res.logo_secundario) {
        setLogoSecundarioPreview(pb.files.getURL(res, res.logo_secundario))
      }
      setLogoPrincipalFile(null)
      setLogoSecundarioFile(null)

      // Aplicar cores imediatamente no DOM e título
      aplicarCoresCss(res)
      if (res.titulo_pagina) {
        document.title = res.titulo_pagina
      }

      toast({
        title: 'Marca atualizada com sucesso!',
        description: 'Logos, cores e título foram salvos e aplicados.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar marca',
        description: err instanceof Error ? err.message : 'Falha na requisição.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoMarca(false)
    }
  }

  // --- Handlers Aba Parâmetros ---
  const handleSalvarParametros = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSalvandoParams(true)

      // 1. Salvar fuso em configuracoes_site
      if (configId) {
        await adminService.updateConfiguracoes(configId, {
          fuso_horario: fusoSelecionado,
        })
        setAppTimezone(fusoSelecionado)
      }

      // 2. Salvar parâmetros operacionais
      if (paramId) {
        const payload: Partial<ParametrosApp> = {
          dias_alerta_sugestao: Number(paramData.dias_alerta_sugestao) || 7,
          dias_pesquisa_aberta: Number(paramData.dias_pesquisa_aberta) || 7,
          dias_validade_homenagem: Number(paramData.dias_validade_homenagem) || 30,
          email_remetente_nome: paramData.email_remetente_nome || '',
          email_remetente: paramData.email_remetente || '',
        }
        const updated = await adminService.updateParametros(paramId, payload)
        setParamData(updated)
      }

      toast({
        title: 'Parâmetros atualizados!',
        description: 'Fuso horário e parâmetros do sistema foram salvos.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar parâmetros',
        description: err instanceof Error ? err.message : 'Falha ao salvar.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoParams(false)
    }
  }

  // --- Handlers Aba Termos ---
  const handleAbrirNovaVersao = (tipo: 'uso_imagem' | 'privacidade') => {
    setTipoNovoTermo(tipo)

    // Achar última versão deste tipo
    const termosDoTipo = termos.filter((t) => t.tipo === tipo)
    let ultimaVersao = 0
    let ultimoTitulo =
      tipo === 'privacidade' ? 'Aviso de Privacidade' : 'Termo de Uso de Imagem e Voz'
    let ultimoConteudo = ''

    if (termosDoTipo.length > 0) {
      const maisRecente = termosDoTipo[0] // já ordenados por versao DESC
      ultimaVersao = maisRecente.versao || 0
      ultimoTitulo = maisRecente.titulo || ultimoTitulo
      ultimoConteudo = maisRecente.conteudo || ''
    }

    setProximaVersao(ultimaVersao + 1)
    setTituloNovoTermo(ultimoTitulo)
    setConteudoNovoTermo(ultimoConteudo)
    setModalNovoTermoOpen(true)
  }

  // Interceptar colagem para garantir preservação de parágrafos de Word / Docs / HTML
  const handlePasteConteudo = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    const htmlData = clipboardData.getData('text/html')
    const plainText = clipboardData.getData('text/plain')

    // Se houver HTML enriquecido (Word, Google Docs, e-mail),
    // verificar se tem estrutura de parágrafos ou quebras
    if (htmlData && /<(p|br|div|h[1-6]|li|ul|ol)\b/i.test(htmlData)) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlData, 'text/html')

        // Remove tags de metadados do Word/Docs
        doc.querySelectorAll('style, meta, link, script, xml, o\\:p').forEach((el) => el.remove())

        // Percorre elementos de bloco para extrair texto com quebras duplas
        const blockElements = doc.body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, tr')
        if (blockElements.length > 0) {
          const lines: string[] = []
          blockElements.forEach((el) => {
            const text = (el.textContent || '').trim()
            if (text) {
              lines.push(text)
            }
          })

          if (lines.length > 1) {
            e.preventDefault()
            const textToInsert = lines.join('\n\n')
            const textarea = e.currentTarget
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const novoConteudo =
              conteudoNovoTermo.substring(0, start) +
              textToInsert +
              conteudoNovoTermo.substring(end)
            setConteudoNovoTermo(novoConteudo)
            setTimeout(() => {
              textarea.focus()
              textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
            }, 0)
            return
          }
        }
      } catch {
        // Fallback para colagem padrão
      }
    }

    // Se o texto puro já veio com quebras de linha normais, deixa o navegador colar normalmente
    // Mas se o texto puro contiver quebras de linha Windows \r\n, normaliza
    if (plainText && plainText.includes('\r')) {
      e.preventDefault()
      const normalized = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const novoConteudo =
        conteudoNovoTermo.substring(0, start) + normalized + conteudoNovoTermo.substring(end)
      setConteudoNovoTermo(novoConteudo)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + normalized.length, start + normalized.length)
      }, 0)
    }
  }

  // Editor simples: inserir tag ao redor do texto selecionado
  const handleFormatarTexto = (tagAbre: string, tagFecha: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selText = conteudoNovoTermo.substring(start, end)
    const replacement = `${tagAbre}${selText || 'texto'}${tagFecha}`

    const novoConteudo =
      conteudoNovoTermo.substring(0, start) + replacement + conteudoNovoTermo.substring(end)
    setConteudoNovoTermo(novoConteudo)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + tagAbre.length,
        start + tagAbre.length + (selText.length || 5),
      )
    }, 0)
  }

  const handleSalvarNovoTermo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tituloNovoTermo.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe um título para esta nova versão do termo.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvandoNovoTermo(true)
      const novo = await adminService.createTermo({
        tipo: tipoNovoTermo,
        versao: proximaVersao,
        titulo: tituloNovoTermo.trim(),
        conteudo: conteudoNovoTermo,
        vigente: false, // Novos termos são criados como não vigentes por segurança
      })

      setTermos((prev) => [novo, ...prev])
      setModalNovoTermoOpen(false)

      toast({
        title: `Versão ${novo.versao} criada!`,
        description:
          'O termo foi salvo como rascunho versionado. Para ativá-lo no site, clique em "Tornar Vigente".',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao criar versão',
        description: err instanceof Error ? err.message : 'Falha ao salvar.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoNovoTermo(false)
    }
  }

  const handleConfirmarTornarVigente = async () => {
    if (!termoParaVigente) return

    try {
      setAtualizandoVigente(true)
      const res = await adminService.setTermoVigente(termoParaVigente.id)

      // Atualizar lista local: o termo vira vigente e outros do mesmo tipo viram não vigentes
      setTermos((prev) =>
        prev.map((t) => {
          if (t.id === res.id) return { ...t, vigente: true }
          if (t.tipo === res.tipo) return { ...t, vigente: false }
          return t
        }),
      )

      toast({
        title: 'Termo Vigente Atualizado!',
        description: `A versão ${res.versao} de "${res.titulo}" agora é a versão oficial em vigor.`,
      })
      setModalVigenteOpen(false)
      setTermoParaVigente(null)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao alterar vigência',
        description: err instanceof Error ? err.message : 'Falha ao atualizar.',
        variant: 'destructive',
      })
    } finally {
      setAtualizandoVigente(false)
    }
  }

  const termosFiltrados = termos.filter((t) => {
    if (filtroTipoTermo === 'todos') return true
    return t.tipo === filtroTipoTermo
  })

  // Se papel for "dho", redirecionar para /admin (após chamada de todos os Hooks)
  if (usuario && usuario.papel !== 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (carregando) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Carregando painel de configurações...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Marca & Configurações do Sistema
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Personalize a identidade visual do cliente, parâmetros operacionais e termos jurídicos
            versionados.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5" />
          Acesso Restrito: Administrador
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'marca' | 'parametros' | 'termos')}
        className="w-full space-y-6"
      >
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl grid grid-cols-3 max-w-md">
          <TabsTrigger
            value="marca"
            className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-xs font-medium flex items-center gap-2"
          >
            <Palette className="w-3.5 h-3.5 text-brand-red" />
            Marca & Cores
          </TabsTrigger>
          <TabsTrigger
            value="parametros"
            className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-xs font-medium flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5 text-brand-orange" />
            Parâmetros
          </TabsTrigger>
          <TabsTrigger
            value="termos"
            className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-xs font-medium flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-brand-lilac" />
            Termos & Privacidade
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            ABA 1: MARCA
           ======================================================== */}
        <TabsContent value="marca" className="space-y-6 focus-visible:outline-none">
          <form onSubmit={handleSalvarMarca} className="space-y-6">
            {/* Bloco Títulos e Nomes */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                Identificação & Título
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="nome_empresa" className="text-xs font-medium text-neutral-300">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="nome_empresa"
                    value={marcaData.nome_empresa || ''}
                    onChange={(e) =>
                      setMarcaData((prev) => ({ ...prev, nome_empresa: e.target.value }))
                    }
                    placeholder="Ex: Credlar Vacation"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="titulo_pagina" className="text-xs font-medium text-neutral-300">
                    Título da Aba do Navegador (Tag Title)
                  </Label>
                  <Input
                    id="titulo_pagina"
                    value={marcaData.titulo_pagina || ''}
                    onChange={(e) =>
                      setMarcaData((prev) => ({ ...prev, titulo_pagina: e.target.value }))
                    }
                    placeholder="Ex: Credlar Vacation"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="url_publica" className="text-xs font-medium text-neutral-300">
                    Endereço público do site
                  </Label>
                  <Input
                    id="url_publica"
                    type="url"
                    value={marcaData.url_publica || ''}
                    onChange={(e) =>
                      setMarcaData((prev) => ({ ...prev, url_publica: e.target.value }))
                    }
                    placeholder="https://seusite.com.br"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Usado para montar os links enviados aos colaboradores. Ex.:
                    https://seusite.com.br
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco Envio de Logos */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                Logotipos do Topo (Hero)
              </h2>
              <p className="text-xs text-neutral-400">
                Faça o envio dos logotipos institucionais em formato transparente (PNG, SVG, WebP)
                com no máximo 2 MB. O logotipo da XDreams no rodapé permanece fixo no sistema.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Principal */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-white">
                      Logotipo Principal (Esquerda)
                    </Label>
                    <p className="text-[11px] text-neutral-400">
                      Normalmente o logotipo da marca do cliente.
                    </p>
                  </div>

                  <div className="h-28 bg-[#0A0A0A] border border-neutral-800 rounded-lg flex items-center justify-center p-3 relative overflow-hidden">
                    {logoPrincipalPreview ? (
                      <img
                        src={logoPrincipalPreview}
                        alt="Pré-visualização Principal"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">
                        Nenhum logo enviado (usando padrão)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition w-full justify-center">
                      <Upload className="w-3.5 h-3.5" />
                      {logoPrincipalPreview ? 'Alterar Logo Principal' : 'Enviar Logo Principal'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoPrincipalChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Logo Secundário */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-white">
                      Logotipo Secundário (Direita)
                    </Label>
                    <p className="text-[11px] text-neutral-400">
                      Normalmente a universidade corporativa ou selo de parceiro.
                    </p>
                  </div>

                  <div className="h-28 bg-[#0A0A0A] border border-neutral-800 rounded-lg flex items-center justify-center p-3 relative overflow-hidden">
                    {logoSecundarioPreview ? (
                      <img
                        src={logoSecundarioPreview}
                        alt="Pré-visualização Secundária"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">
                        Nenhum logo enviado (usando padrão)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition w-full justify-center">
                      <Upload className="w-3.5 h-3.5" />
                      {logoSecundarioPreview ? 'Alterar Logo Secundário' : 'Enviar Logo Secundário'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoSecundarioChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco Cores da Marca */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                    Paleta de Cores da Marca
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Selecione as cores institucionais. O valor hexadecimal é exibido e salvo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestaurarCoresPadrao}
                  className="border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-white hover:text-white text-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  Restaurar Cores Padrão
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Vermelho / Primária */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Cor Primária</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_primaria || '#CC1F1F'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_primaria || '#CC1F1F'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_primaria: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_primaria || '#CC1F1F'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_primaria: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Laranja / Secundária */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Cor Secundária</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_secundaria || '#E85C1A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_secundaria || '#E85C1A'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_secundaria: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_secundaria || '#E85C1A'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_secundaria: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Amarelo / Destaque */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Cor Destaque</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_destaque || '#F5A623'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_destaque || '#F5A623'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_destaque: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_destaque || '#F5A623'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_destaque: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Lilás */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Cor Lilás</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_lilas || '#9B5FC0'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_lilas || '#9B5FC0'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_lilas: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_lilas || '#9B5FC0'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_lilas: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Dourado */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Cor Dourado</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_dourado || '#FFD700'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_dourado || '#FFD700'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_dourado: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_dourado || '#FFD700'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_dourado: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Fundo Escuro */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Fundo Escuro</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_fundo_escuro || '#0A0A0A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_fundo_escuro || '#0A0A0A'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_escuro: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_fundo_escuro || '#0A0A0A'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_escuro: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Fundo Gradiente */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Fundo Gradiente
                    </Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_fundo_gradiente || '#8B0000'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_fundo_gradiente || '#8B0000'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_gradiente: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_fundo_gradiente || '#8B0000'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_gradiente: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Fundo Claro */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">Fundo Claro</Label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {marcaData.cor_fundo_claro || '#FAFAFA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={marcaData.cor_fundo_claro || '#FAFAFA'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_claro: e.target.value }))
                      }
                      className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      value={marcaData.cor_fundo_claro || '#FAFAFA'}
                      onChange={(e) =>
                        setMarcaData((prev) => ({ ...prev, cor_fundo_claro: e.target.value }))
                      }
                      className="h-8 bg-neutral-900 border-neutral-700 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Salvar Marca */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={salvandoMarca}
                className="bg-gradient-brand hover:opacity-95 text-white font-semibold px-6 py-2.5 transition shadow-lg shadow-brand-red/20 border-0 flex items-center gap-2"
              >
                {salvandoMarca ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando Marca...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Marca & Cores
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ========================================================
            ABA 2: PARÂMETROS
           ======================================================== */}
        <TabsContent value="parametros" className="space-y-6 focus-visible:outline-none">
          <form onSubmit={handleSalvarParametros} className="space-y-6">
            {/* Bloco Fuso Horário Centralizado */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <Clock className="w-4 h-4 text-brand-orange" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                  Fuso Horário Operacional
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                Define o fuso horário oficial para cálculo de prazos, agendamento da faixa de aviso,
                registros de auditoria e exportações CSV.
              </p>

              <div className="max-w-xl space-y-1.5">
                <Label htmlFor="fuso_horario" className="text-xs font-medium text-neutral-300">
                  Fuso Horário (Brasil & Portugal)
                </Label>
                <Select value={fusoSelecionado} onValueChange={setFusoSelecionado}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white text-xs">
                    <SelectValue placeholder="Selecione o fuso" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white text-xs">
                    {FUSOS_HORARIOS.map((fuso) => (
                      <SelectItem key={fuso.value} value={fuso.value}>
                        {fuso.label} ({fuso.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bloco Parâmetros do Sistema */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <Settings className="w-4 h-4 text-brand-orange" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                  Parâmetros de Funcionamento & Prazos
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="dias_alerta_sugestao"
                    className="text-xs font-medium text-neutral-300"
                  >
                    Dias de Alerta para Sugestão
                  </Label>
                  <Input
                    id="dias_alerta_sugestao"
                    type="number"
                    min="1"
                    value={paramData.dias_alerta_sugestao ?? 7}
                    onChange={(e) =>
                      setParamData((prev) => ({
                        ...prev,
                        dias_alerta_sugestao: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                    required
                  />
                  <p className="text-[11px] text-neutral-500">
                    Prazo em dias para aviso antes de encerrar ciclo de sugestões.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dias_pesquisa_aberta"
                    className="text-xs font-medium text-neutral-300"
                  >
                    Dias de Pesquisa Aberta
                  </Label>
                  <Input
                    id="dias_pesquisa_aberta"
                    type="number"
                    min="1"
                    value={paramData.dias_pesquisa_aberta ?? 7}
                    onChange={(e) =>
                      setParamData((prev) => ({
                        ...prev,
                        dias_pesquisa_aberta: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                    required
                  />
                  <p className="text-[11px] text-neutral-500">
                    Período em que formulários de pesquisa de clima/opinião ficam ativos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dias_validade_homenagem"
                    className="text-xs font-medium text-neutral-300"
                  >
                    Dias de Validade de Homenagem
                  </Label>
                  <Input
                    id="dias_validade_homenagem"
                    type="number"
                    min="1"
                    value={paramData.dias_validade_homenagem ?? 30}
                    onChange={(e) =>
                      setParamData((prev) => ({
                        ...prev,
                        dias_validade_homenagem: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                    required
                  />
                  <p className="text-[11px] text-neutral-500">
                    Duração de destaque de novas homenagens na plataforma.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-neutral-800/80">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email_remetente_nome"
                    className="text-xs font-medium text-neutral-300"
                  >
                    Nome do Remetente de E-mail
                  </Label>
                  <Input
                    id="email_remetente_nome"
                    value={paramData.email_remetente_nome || ''}
                    onChange={(e) =>
                      setParamData((prev) => ({ ...prev, email_remetente_nome: e.target.value }))
                    }
                    placeholder="Ex: Credlar Vacation Comunicação"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email_remetente" className="text-xs font-medium text-neutral-300">
                    E-mail do Remetente
                  </Label>
                  <Input
                    id="email_remetente"
                    type="email"
                    value={paramData.email_remetente || ''}
                    onChange={(e) =>
                      setParamData((prev) => ({ ...prev, email_remetente: e.target.value }))
                    }
                    placeholder="contato@credlarvacation.com.br"
                    className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Botão Salvar Parâmetros */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={salvandoParams}
                className="bg-gradient-brand hover:opacity-95 text-white font-semibold px-6 py-2.5 transition shadow-lg shadow-brand-red/20 border-0 flex items-center gap-2"
              >
                {salvandoParams ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando Parâmetros...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Parâmetros
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ========================================================
            ABA 3: TERMOS & PRIVACIDADE
           ======================================================== */}
        <TabsContent value="termos" className="space-y-6 focus-visible:outline-none">
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-neutral-300">
                  Termos de Uso & Aviso de Privacidade
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Gerencie versões auditadas dos termos legais. Cada alteração cria uma versão nova
                  (v+1); termos anteriores permanecem imutáveis para conformidade.
                </p>
              </div>

              {/* Botões de Nova Versão */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleAbrirNovaVersao('privacidade')}
                  size="sm"
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-orange" />
                  Nova Versão: Privacidade
                </Button>
                <Button
                  onClick={() => handleAbrirNovaVersao('uso_imagem')}
                  size="sm"
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-lilac" />
                  Nova Versão: Imagem
                </Button>
              </div>
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Filtrar por:</span>
                <div className="inline-flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setFiltroTipoTermo('todos')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                      filtroTipoTermo === 'todos'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoTermo('privacidade')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                      filtroTipoTermo === 'privacidade'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Privacidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroTipoTermo('uso_imagem')}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                      filtroTipoTermo === 'uso_imagem'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Uso de Imagem
                  </button>
                </div>
              </div>

              <a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-orange hover:underline inline-flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver página pública /privacidade
              </a>
            </div>

            {/* Tabela de Termos */}
            {termosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs border border-neutral-800/80 rounded-xl bg-neutral-950/40">
                Nenhum termo cadastrado ainda para este filtro. Clique em "Nova Versão" acima para
                adicionar o primeiro termo.
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Versão</th>
                      <th className="px-4 py-3">Título</th>
                      <th className="px-4 py-3">Data de Criação</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {termosFiltrados.map((t) => (
                      <tr key={t.id} className="hover:bg-neutral-800/30 transition">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              t.tipo === 'privacidade'
                                ? 'bg-orange-500/10 text-brand-orange border border-orange-500/20'
                                : 'bg-purple-500/10 text-brand-lilac border border-purple-500/20'
                            }`}
                          >
                            {t.tipo === 'privacidade' ? 'Privacidade' : 'Uso de Imagem'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">v{t.versao}</td>
                        <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                          {t.titulo}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                          {formatarDataHora(t.created)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {t.vigente ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Vigente
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] text-neutral-500">
                              Histórico
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTermoParaVisualizar(t)
                                setModalVisualizarOpen(true)
                              }}
                              className="h-7 text-[11px] text-neutral-300 hover:text-white px-2 flex items-center gap-1"
                              title="Visualizar formatação do termo"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-orange" />
                              Visualizar
                            </Button>
                            {!t.vigente && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTermoParaVigente(t)
                                  setModalVigenteOpen(true)
                                }}
                                className="h-7 text-[11px] border-emerald-500/50 bg-neutral-800/80 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 px-2.5"
                              >
                                Tornar vigente
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTipoNovoTermo(t.tipo)
                                setProximaVersao(
                                  Math.max(
                                    ...termos.filter((x) => x.tipo === t.tipo).map((x) => x.versao),
                                    0,
                                  ) + 1,
                                )
                                setTituloNovoTermo(t.titulo)
                                setConteudoNovoTermo(t.conteudo || '')
                                setModalNovoTermoOpen(true)
                              }}
                              className="h-7 text-[11px] text-neutral-400 hover:text-white px-2"
                              title="Criar nova versão a partir desta"
                            >
                              Nova versão
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Nova Versão de Termo */}
      <Dialog open={modalNovoTermoOpen} onOpenChange={setModalNovoTermoOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-orange" />
              Nova Versão {proximaVersao} —{' '}
              {tipoNovoTermo === 'privacidade' ? 'Aviso de Privacidade' : 'Uso de Imagem'}
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Esta ação cria um novo registro com versão {proximaVersao}. A versão anterior
              permanece intacta no histórico para auditoria legal.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSalvarNovoTermo}
            className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="titulo_termo" className="text-xs font-medium text-neutral-300">
                Título do Documento
              </Label>
              <Input
                id="titulo_termo"
                value={tituloNovoTermo}
                onChange={(e) => setTituloNovoTermo(e.target.value)}
                placeholder="Ex: Aviso de Privacidade e Tratamento de Dados"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange text-xs"
                required
              />
            </div>

            {/* Editor de Texto Simples (Parágrafos, Negrito, Listas, Links) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-neutral-300">
                  Conteúdo do Termo (HTML ou Texto Formatado)
                </Label>
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleFormatarTexto('<strong>', '</strong>')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                    title="Negrito <strong>"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatarTexto('<em>', '</em>')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                    title="Itálico <em>"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatarTexto('<p>', '</p>')}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                    title="Parágrafo <p>"
                  >
                    &lt;p&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatarTexto('<ul>\n  <li>', '</li>\n</ul>')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                    title="Lista <ul><li>"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatarTexto('<a href="https://exemplo.com">', '</a>')}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white"
                    title="Link <a href>"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={10}
                value={conteudoNovoTermo}
                onChange={(e) => setConteudoNovoTermo(e.target.value)}
                onPaste={handlePasteConteudo}
                placeholder="Insira aqui o texto completo do termo legal... (Textos colados de Word, Docs ou e-mail mantêm os parágrafos)"
                className="w-full rounded-md bg-neutral-950 border border-neutral-800 p-3 text-xs text-neutral-200 font-mono leading-relaxed focus:border-brand-orange focus:outline-none"
              />
              <p className="text-[11px] text-neutral-500">
                O conteúdo aceita texto puro ou HTML. Quebras duplas viram novos parágrafos
                automaticamente.
              </p>
            </div>

            {/* Pré-visualização com o MESMO componente de exibição */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-brand-orange flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Pré-visualização ao Vivo (exatamente como aparecerá aos usuários)
                </Label>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  Prévia do Termo
                </span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 sm:p-5 max-h-60 overflow-y-auto shadow-inner">
                {conteudoNovoTermo.trim() ? (
                  <TermoConteudo conteudo={conteudoNovoTermo} variant="dark" />
                ) : (
                  <p className="text-neutral-500 italic text-xs">
                    Digite ou cole o texto acima para ver a pré-visualização formatada em tempo
                    real...
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNovoTermoOpen(false)}
                className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoNovoTermo}
                className="bg-gradient-brand hover:opacity-95 text-white text-xs border-0"
              >
                {salvandoNovoTermo
                  ? 'Salvando Versão...'
                  : `Salvar Nova Versão (v${proximaVersao})`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Visualizar Termo do Painel */}
      <Dialog open={modalVisualizarOpen} onOpenChange={setModalVisualizarOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-orange" />
                <DialogTitle className="text-base text-white">
                  {termoParaVisualizar?.titulo}
                </DialogTitle>
              </div>
              {termoParaVisualizar && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-neutral-800 text-neutral-300">
                  v{termoParaVisualizar.versao} {termoParaVisualizar.vigente ? '(Vigente)' : ''}
                </span>
              )}
            </div>
            <DialogDescription className="text-neutral-400 text-xs">
              Visualização fiel da formatação do termo, renderizada com o componente oficial.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950/70 rounded-xl border border-neutral-800 mt-2 max-h-[60vh]">
            <TermoConteudo conteudo={termoParaVisualizar?.conteudo} variant="dark" />
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              {termoParaVisualizar?.tipo === 'privacidade'
                ? 'Aviso de Privacidade'
                : 'Uso de Imagem'}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalVisualizarOpen(false)}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmação de Tornar Vigente */}
      <Dialog open={modalVigenteOpen} onOpenChange={setModalVigenteOpen}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-400" />
              <DialogTitle className="text-base text-white">Tornar Termo Vigente?</DialogTitle>
            </div>
            <DialogDescription className="text-neutral-400 text-xs pt-2">
              Você está prestes a ativar a <strong>Versão {termoParaVigente?.versao}</strong> de{' '}
              <strong>"{termoParaVigente?.titulo}"</strong> como o documento oficial em vigor.
              <br />
              <br />
              Todas as outras versões deste mesmo tipo serão automaticamente desmarcadas pelo
              sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalVigenteOpen(false)}
              className="border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={atualizandoVigente}
              onClick={handleConfirmarTornarVigente}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs border-0"
            >
              {atualizandoVigente ? 'Ativando...' : 'Confirmar e Tornar Vigente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default AdminConfiguracoesPage
