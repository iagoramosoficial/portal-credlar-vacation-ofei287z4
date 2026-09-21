import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { sanitizeHtml } from '@/lib/sanitize'
import { formatarApenasData } from '@/lib/timezone'
import credlarLogo from '@/assets/logo-vertical-negativo-branco-vacataion-28a59.png'
import {
  ShieldCheck,
  AlertCircle,
  Upload,
  CheckCircle2,
  XCircle,
  Camera,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface TermoData {
  titulo: string
  versao: number
  conteudo: string
}

interface ConviteResponse {
  status: 'convidado' | 'autorizado' | 'recusado' | 'revogado'
  nome_exibicao?: string
  data_validade?: string
  termo?: TermoData | null
  message?: string
}

export const CadastroLiderPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { config } = useConteudoSite()

  const [loading, setLoading] = useState(true)
  const [dadosConvite, setDadosConvite] = useState<ConviteResponse | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  // Formulário de aceite
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [dataAdmissao, setDataAdmissao] = useState('')
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [concordouTermo, setConcordouTermo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  // Modais de confirmação
  const [modalRecusaOpen, setModalRecusaOpen] = useState(false)
  const [modalRevogacaoOpen, setModalRevogacaoOpen] = useState(false)
  const [acaoConcluida, setAcaoConcluida] = useState<'aceite' | 'recusa' | 'revogacao' | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Meta tag noindex
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

  // Carregar dados do convite
  useEffect(() => {
    if (!token) {
      setLoading(false)
      setErroCarregamento('Link de convite inválido ou incompleto.')
      return
    }

    let isMounted = true

    async function buscarConvite() {
      try {
        setLoading(true)
        setErroCarregamento(null)
        const res = await pb.send<ConviteResponse>(`/backend/v1/cadastro/${token}`, {
          method: 'GET',
        })
        if (isMounted) {
          setDadosConvite(res)
          if (res.nome_exibicao) {
            setNomeExibicao(res.nome_exibicao)
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const pbErr = err as { data?: { message?: string }; message?: string }
          setErroCarregamento(
            pbErr?.data?.message ||
              pbErr?.message ||
              'Este link de convite é inválido ou já expirou.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    buscarConvite()

    return () => {
      isMounted = false
    }
  }, [token])

  // Lidar com seleção de foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo e tamanho (5MB)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setErroForm('Formato de foto inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErroForm('A foto selecionada ultrapassa o limite de 5 MB.')
      return
    }

    setErroForm(null)
    setFotoArquivo(file)
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Submissão de aceite
  const handleAceitar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!concordouTermo) {
      setErroForm('É obrigatório concordar com o termo de autorização de imagem para prosseguir.')
      return
    }

    if (!fotoArquivo) {
      setErroForm('Por favor, selecione e envie a sua foto.')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('nome_exibicao', nomeExibicao.trim())
      if (dataAdmissao) {
        formData.append('data_admissao', dataAdmissao)
      }
      formData.append('foto', fotoArquivo)
      formData.append('aceite', 'true')

      await pb.send(`/backend/v1/cadastro/${token}/aceitar`, {
        method: 'POST',
        body: formData,
      })

      setAcaoConcluida('aceite')
      setDadosConvite((prev) => (prev ? { ...prev, status: 'autorizado' } : null))
    } catch (err: unknown) {
      const pbErr = err as { data?: { message?: string }; message?: string }
      setErroForm(
        pbErr?.data?.message || pbErr?.message || 'Erro ao registrar autorização. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Submissão de recusa
  const handleConfirmarRecusa = async () => {
    setSubmitting(true)
    try {
      await pb.send(`/backend/v1/cadastro/${token}/recusar`, {
        method: 'POST',
      })
      setModalRecusaOpen(false)
      setAcaoConcluida('recusa')
      setDadosConvite((prev) => (prev ? { ...prev, status: 'recusado' } : null))
    } catch (err: unknown) {
      const pbErr = err as { data?: { message?: string }; message?: string }
      setErroForm(pbErr?.data?.message || 'Erro ao registrar recusa.')
    } finally {
      setSubmitting(false)
    }
  }

  // Submissão de revogação
  const handleConfirmarRevogacao = async () => {
    setSubmitting(true)
    try {
      await pb.send(`/backend/v1/cadastro/${token}/revogar`, {
        method: 'POST',
      })
      setModalRevogacaoOpen(false)
      setAcaoConcluida('revogacao')
      setDadosConvite((prev) => (prev ? { ...prev, status: 'revogado' } : null))
    } catch (err: unknown) {
      const pbErr = err as { data?: { message?: string }; message?: string }
      setErroForm(pbErr?.data?.message || 'Erro ao revogar autorização.')
    } finally {
      setSubmitting(false)
    }
  }

  // Obter logo
  let logoSrc = credlarLogo
  if (config?.id && config?.logo_principal) {
    logoSrc = pb.files.getURL(config, config.logo_principal)
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F9FAFB] text-neutral-900 font-sans selection:bg-brand-red selection:text-white">
      {/* Topo escuro simples */}
      <header className="bg-[#0A0A0A] text-white border-b border-white/10 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt={config?.nome_empresa || 'Credlar Vacation'}
              className="h-7 md:h-8 max-w-[140px] object-contain drop-shadow"
            />
            <span className="hidden sm:inline-block text-xs text-neutral-400 border-l border-neutral-700 pl-3">
              Cadastro de Líderes
            </span>
          </div>

          <Link
            to="/privacidade"
            className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
            <span>Privacidade</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col justify-center">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Carregando dados do convite...</p>
          </div>
        ) : erroCarregamento ? (
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <AlertCircle className="w-7 h-7 text-neutral-500" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Convite Indisponível</h1>
            <p className="text-neutral-600 text-sm max-w-md mx-auto">
              Este link de convite é inválido, foi cancelado ou já expirou. Em caso de dúvidas,
              entre em contato com o time de DHO ou Gestão da UniCredlar.
            </p>
          </div>
        ) : acaoConcluida === 'aceite' ? (
          // Tela de Sucesso após autorizar
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-6 md:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">Autorização Concluída!</h1>
              <p className="text-neutral-600 text-sm">
                Obrigado por autorizar o uso da sua foto e completar seus dados para o Hall da Fama
                da UniCredlar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs md:text-sm text-left flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Aviso importante:</p>
                <p>
                  <strong>Guarde este link.</strong> Por ele você pode revogar sua autorização a
                  qualquer momento.
                </p>
              </div>
            </div>
          </div>
        ) : acaoConcluida === 'recusa' || dadosConvite?.status === 'recusado' ? (
          // Tela de Recusado
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <XCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Convite Recusado</h1>
            <p className="text-neutral-600 text-sm max-w-md mx-auto">
              Sua resposta foi registrada com sucesso e respeitamos a sua decisão. Nenhuma foto ou
              dado seu será publicado.
            </p>
          </div>
        ) : acaoConcluida === 'revogacao' || dadosConvite?.status === 'revogado' ? (
          // Tela de Revogado
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <ShieldAlert className="w-7 h-7 text-neutral-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Autorização Revogada</h1>
            <p className="text-neutral-600 text-sm max-w-md mx-auto">
              A autorização de uso de imagem foi revogada com sucesso e a sua foto foi apagada de
              nossos registros.
            </p>
          </div>
        ) : dadosConvite?.status === 'autorizado' ? (
          // Já Autorizado (acesso posterior pelo mesmo link)
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-6 md:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                Olá, {dadosConvite.nome_exibicao}!
              </h1>
              <p className="text-sm text-neutral-600">
                Sua autorização de uso de imagem para o Hall da Fama está <strong>ativa</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs text-left">
              <p>
                Caso deseje retirar a sua foto e cancelar a veiculação de sua imagem no ecossistema,
                você pode revogar a autorização clicando no botão abaixo.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => setModalRevogacaoOpen(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
              >
                Revogar autorização
              </Button>
            </div>
          </div>
        ) : (
          // Fluxo Principal: Status "convidado"
          <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-6 md:p-10 space-y-8">
            {/* Saudação */}
            <div className="space-y-1 pb-4 border-b border-neutral-100">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Olá, {dadosConvite?.nome_exibicao || 'Líder'}!
              </h1>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Você foi convidado(a) para participar do Hall da Fama da UniCredlar. Para completar
                seu cadastro, confirme suas informações e autorize o uso de sua foto.
              </p>
              {dadosConvite?.data_validade && (
                <p className="text-xs text-neutral-400 pt-1">
                  Convite válido até: {formatarApenasData(dadosConvite.data_validade)}
                </p>
              )}
            </div>

            {erroForm && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            <form onSubmit={handleAceitar} className="space-y-6">
              {/* Nome de Exibição */}
              <div className="space-y-2">
                <Label htmlFor="nome_exibicao" className="text-xs font-semibold text-neutral-700">
                  Nome de Exibição (como deseja aparecer)
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="nome_exibicao"
                    value={nomeExibicao}
                    onChange={(e) => setNomeExibicao(e.target.value)}
                    required
                    placeholder="Seu nome preferido"
                    className="pl-9 h-11 text-sm bg-neutral-50/50 border-neutral-200 focus:bg-white"
                  />
                </div>
              </div>

              {/* Data de Admissão */}
              <div className="space-y-2">
                <Label htmlFor="data_admissao" className="text-xs font-semibold text-neutral-700">
                  Data de Admissão na Empresa
                </Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="data_admissao"
                    type="date"
                    value={dataAdmissao}
                    onChange={(e) => setDataAdmissao(e.target.value)}
                    className="pl-9 h-11 text-sm bg-neutral-50/50 border-neutral-200 focus:bg-white"
                  />
                </div>
              </div>

              {/* Upload de Foto com Preview Quadrado */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-neutral-700">
                  Sua Foto de Perfil (Obrigatória)
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50">
                  {/* Preview Quadrado */}
                  <div className="w-28 h-28 rounded-xl bg-neutral-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Pré-visualização"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                        <Camera className="w-6 h-6 text-neutral-400" />
                        <span>Sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Botão de Envio */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-xs text-neutral-600">
                      Envie uma foto nítida e profissional. A imagem será recortada em proporção
                      quadrada (máx. 5 MB).
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs border-neutral-300 hover:bg-neutral-100"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      {fotoArquivo ? 'Alterar foto' : 'Selecionar foto'}
                    </Button>
                    {fotoArquivo && (
                      <p className="text-[11px] text-emerald-600 truncate font-medium">
                        ✓ {fotoArquivo.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Termo de Uso de Imagem Vigente em Área Rolável */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-neutral-700">
                    Termo de Autorização de Uso de Imagem
                  </Label>
                  {dadosConvite?.termo?.versao && (
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Versão {dadosConvite.termo.versao}
                    </span>
                  )}
                </div>

                <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 max-h-56 overflow-y-auto text-xs text-neutral-700 leading-relaxed shadow-inner">
                  {dadosConvite?.termo?.conteudo ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(dadosConvite.termo.conteudo),
                      }}
                      className="prose prose-sm max-w-none space-y-2 text-neutral-700"
                    />
                  ) : (
                    <p className="text-neutral-500 italic">
                      Termo de autorização padrão para inclusão de foto e dados biográficos no Hall
                      da Fama da UniCredlar.
                    </p>
                  )}
                </div>
              </div>

              {/* Checkbox de Aceite */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <Checkbox
                  id="termo_aceite"
                  checked={concordouTermo}
                  onCheckedChange={(checked) => setConcordouTermo(!!checked)}
                  className="mt-0.5 border-neutral-400 data-[state=checked]:bg-brand-red data-[state=checked]:border-brand-red"
                />
                <label
                  htmlFor="termo_aceite"
                  className="text-xs text-neutral-700 leading-snug cursor-pointer select-none font-medium"
                >
                  Li e autorizo o uso da minha imagem conforme este termo.
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalRecusaOpen(true)}
                  disabled={submitting}
                  className="text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto order-2 sm:order-1"
                >
                  Não autorizo
                </Button>

                <Button
                  type="submit"
                  disabled={submitting || !concordouTermo || !fotoArquivo}
                  className="w-full sm:w-auto bg-gradient-brand text-white hover:opacity-90 font-medium text-xs md:text-sm px-6 h-11 shadow-sm order-1 sm:order-2"
                >
                  {submitting ? 'Salvando...' : 'Autorizar'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Rodapé simples com link de Privacidade */}
      <footer className="py-6 border-t border-neutral-200 text-center text-xs text-neutral-500 bg-white">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} {config?.nome_empresa || 'Credlar Vacation'}. Todos os
            direitos reservados.
          </p>
          <Link to="/privacidade" className="text-brand-orange hover:underline">
            Aviso de Privacidade
          </Link>
        </div>
      </footer>

      {/* Modal Confirmação de Recusa */}
      <Dialog open={modalRecusaOpen} onOpenChange={setModalRecusaOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Confirmar Não Autorização
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600 leading-relaxed pt-2">
              Ao não autorizar, seus dados e foto não serão incluídos no Hall da Fama. Você tem
              certeza de que deseja recusar este convite?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRecusaOpen(false)}
              disabled={submitting}
              className="text-xs border-neutral-300"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmarRecusa}
              disabled={submitting}
              className="text-xs"
            >
              {submitting ? 'Gravando...' : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmação de Revogação */}
      <Dialog open={modalRevogacaoOpen} onOpenChange={setModalRevogacaoOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600">
              Revogar Autorização de Imagem
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600 leading-relaxed pt-2">
              Ao revogar sua autorização, sua foto será <strong>apagada imediatamente</strong> de
              nossos sistemas e sua participação no Hall da Fama será descontinuada. Esta ação tem
              efeito permanente. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRevogacaoOpen(false)}
              disabled={submitting}
              className="text-xs border-neutral-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmarRevogacao}
              disabled={submitting}
              className="text-xs"
            >
              {submitting ? 'Revogando...' : 'Confirmar Revogação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CadastroLiderPage
