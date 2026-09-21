import React, { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { ConfiguracoesSite, CONFIGURACOES_PADRAO } from '@/lib/conteudo-padrao'
import { APP_TIMEZONE, utcToLocalInputDateTime, dateStringToUtcIso } from '@/lib/timezone'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Globe, Save, CheckCircle2, AlertTriangle, Info, Calendar, Sparkles } from 'lucide-react'

export const AdminSitePage: React.FC = () => {
  const [configId, setConfigId] = useState<string>('')
  const [formData, setFormData] = useState<ConfiguracoesSite>(CONFIGURACOES_PADRAO)
  const [dataInicioLocal, setDataInicioLocal] = useState<string>('')
  const [dataFimLocal, setDataFimLocal] = useState<string>('')

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucessoSalvar, setSucessoSalvar] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true)
        const record = await adminService.getConfiguracoes()
        setConfigId(record.id)
        setFormData(record)

        // Converter datas UTC do banco para o input datetime-local no fuso de Brasília
        setDataInicioLocal(utcToLocalInputDateTime(record.aviso_inicio))
        setDataFimLocal(utcToLocalInputDateTime(record.aviso_fim))
      } catch (err) {
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível buscar os dados do site no banco.',
          variant: 'destructive',
        })
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [toast])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configId) return

    // Validar link da faixa de aviso se fornecido
    if (formData.aviso_link && formData.aviso_link.trim()) {
      try {
        new URL(formData.aviso_link.trim())
      } catch {
        toast({
          title: 'URL inválida',
          description: 'O link da faixa de aviso deve ser uma URL válida (ex: https://...).',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setSalvando(true)
      setSucessoSalvar(false)

      // Converter inputs no fuso de Brasília para UTC ISO para salvar no banco
      const payload: Partial<ConfiguracoesSite> = {
        nome_empresa: formData.nome_empresa,
        hero_linha_1: formData.hero_linha_1,
        hero_destaque: formData.hero_destaque,
        hero_frase: formData.hero_frase,
        rodape_parceria: formData.rodape_parceria,
        rodape_metodologia: formData.rodape_metodologia,
        rodape_frase_1: formData.rodape_frase_1,
        rodape_frase_2: formData.rodape_frase_2,
        aviso_ativo: !!formData.aviso_ativo,
        aviso_texto: formData.aviso_texto || '',
        aviso_link: formData.aviso_link ? formData.aviso_link.trim() : '',
        aviso_inicio: dataInicioLocal ? dateStringToUtcIso(dataInicioLocal, false) : '',
        aviso_fim: dataFimLocal ? dateStringToUtcIso(dataFimLocal, true) : '',
      }

      const res = await adminService.updateConfiguracoes(configId, payload)
      setFormData(res)
      setDataInicioLocal(utcToLocalInputDateTime(res.aviso_inicio))
      setDataFimLocal(utcToLocalInputDateTime(res.aviso_fim))

      setSucessoSalvar(true)
      toast({
        title: 'Alterações salvas com sucesso!',
        description: 'Os textos do site e as regras da faixa de aviso foram atualizados.',
      })

      setTimeout(() => {
        setSucessoSalvar(false)
      }, 4000)
    } catch (err: unknown) {
      toast({
        title: 'Falha ao salvar',
        description: err instanceof Error ? err.message : 'Erro ao persistir as configurações.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Carregando textos do site...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-orange" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Textos do Site & Faixa de Aviso
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Edite os textos do topo, do rodapé e programe mensagens em destaque para o público.
          </p>
        </div>

        {sucessoSalvar && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Salvo com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSalvar} className="space-y-8">
        {/* Bloco 1: Faixa de Aviso */}
        <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                <h2 className="text-base font-bold text-white">Faixa de Aviso Superior (Banner)</h2>
              </div>
              <p className="text-xs text-neutral-400">
                Aparece no topo do site para avisos institucionais importantes, novidades ou links
                rápidos.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-neutral-950/70 px-4 py-2 rounded-xl border border-neutral-800 self-start sm:self-auto">
              <Label
                htmlFor="aviso_ativo"
                className="text-xs font-medium text-neutral-300 cursor-pointer"
              >
                {formData.aviso_ativo ? 'Banner ATIVADO' : 'Banner DESATIVADO'}
              </Label>
              <Switch
                id="aviso_ativo"
                checked={formData.aviso_ativo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, aviso_ativo: checked }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="aviso_texto" className="text-xs font-medium text-neutral-300">
                Texto do Aviso
              </Label>
              <Input
                id="aviso_texto"
                value={formData.aviso_texto || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, aviso_texto: e.target.value }))}
                placeholder="Ex: Atenção colaboradores: as inscrições para o curso encerram amanhã!"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="aviso_link" className="text-xs font-medium text-neutral-300">
                Link de Destino (opcional)
              </Label>
              <Input
                id="aviso_link"
                type="url"
                value={formData.aviso_link || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, aviso_link: e.target.value }))}
                placeholder="https://exemplo.com.br/detalhes"
                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange"
              />
              <p className="text-[11px] text-neutral-500">
                Se informado, toda a faixa se tornará clicável e abrirá em nova aba.
              </p>
            </div>

            {/* Datas com fuso de Brasília */}
            <div className="space-y-1.5">
              <Label
                htmlFor="aviso_inicio"
                className="text-xs font-medium text-neutral-300 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                Data e Hora de Início (Horário de Brasília)
              </Label>
              <Input
                id="aviso_inicio"
                type="datetime-local"
                value={dataInicioLocal}
                onChange={(e) => setDataInicioLocal(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
              <p className="text-[11px] text-neutral-500">
                Deixe em branco para exibir imediatamente quando o aviso estiver ativo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="aviso_fim"
                className="text-xs font-medium text-neutral-300 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                Data e Hora de Término (Horário de Brasília)
              </Label>
              <Input
                id="aviso_fim"
                type="datetime-local"
                value={dataFimLocal}
                onChange={(e) => setDataFimLocal(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
              <p className="text-[11px] text-neutral-500">
                Ao selecionar uma data sem hora específica, o aviso permanece até 23:59:59 daquele
                dia em Brasília.
              </p>
            </div>
          </div>
        </section>

        {/* Bloco 2: Seção Hero (Topo da Página) */}
        <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="pb-4 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-yellow" />
              Topo da Página (Seção Hero)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Título e frase principal de boas-vindas na abertura do site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="nome_empresa" className="text-xs font-medium text-neutral-300">
                Nome da Empresa / Portal
              </Label>
              <Input
                id="nome_empresa"
                value={formData.nome_empresa || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome_empresa: e.target.value }))}
                required
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero_linha_1" className="text-xs font-medium text-neutral-300">
                Hero - Linha 1 (Texto Superior)
              </Label>
              <Input
                id="hero_linha_1"
                value={formData.hero_linha_1 || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_linha_1: e.target.value }))}
                required
                placeholder="Ex: Bem-vindo ao"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero_destaque" className="text-xs font-medium text-neutral-300">
                Hero - Título em Destaque (Gradiente da Marca)
              </Label>
              <Input
                id="hero_destaque"
                value={formData.hero_destaque || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hero_destaque: e.target.value }))
                }
                required
                placeholder="Ex: Ecossistema Credlar"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="hero_frase" className="text-xs font-medium text-neutral-300">
                Hero - Frase de Impacto (Cursiva / Subtítulo)
              </Label>
              <Input
                id="hero_frase"
                value={formData.hero_frase || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, hero_frase: e.target.value }))}
                required
                placeholder="Ex: Seu veículo para a realização dos seus sonhos"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>
          </div>
        </section>

        {/* Bloco 3: Seção Rodapé */}
        <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="pb-4 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white">Rodapé do Site</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Frases institucionais, parcerias e metodologias exibidas na base de todas as telas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="rodape_parceria" className="text-xs font-medium text-neutral-300">
                Rodapé - Linha de Parceria
              </Label>
              <Input
                id="rodape_parceria"
                value={formData.rodape_parceria || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rodape_parceria: e.target.value }))
                }
                required
                placeholder="Ex: Em parceria estratégica com XDreams Advisory"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rodape_metodologia" className="text-xs font-medium text-neutral-300">
                Rodapé - Metodologia
              </Label>
              <Input
                id="rodape_metodologia"
                value={formData.rodape_metodologia || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rodape_metodologia: e.target.value }))
                }
                required
                placeholder="Ex: Governança e Metodologia LPP"
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rodape_frase_1" className="text-xs font-medium text-neutral-300">
                Rodapé - Frase 1 (Texto Principal)
              </Label>
              <Input
                id="rodape_frase_1"
                value={formData.rodape_frase_1 || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rodape_frase_1: e.target.value }))
                }
                required
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rodape_frase_2" className="text-xs font-medium text-neutral-300">
                Rodapé - Frase 2 (Texto em Destaque)
              </Label>
              <Input
                id="rodape_frase_2"
                value={formData.rodape_frase_2 || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rodape_frase_2: e.target.value }))
                }
                required
                className="bg-neutral-950 border-neutral-800 text-white focus:border-brand-orange"
              />
            </div>
          </div>
        </section>

        {/* Barra de Ação Flutuante / Final com Único Botão Salvar */}
        <div className="sticky bottom-4 z-30 p-4 rounded-xl bg-neutral-950/90 border border-neutral-800 shadow-2xl backdrop-blur flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Info className="w-4 h-4 text-brand-orange shrink-0" />
            <span>As alterações são aplicadas instantaneamente no banco de dados.</span>
          </div>

          <Button
            type="submit"
            disabled={salvando}
            className="bg-gradient-brand hover:opacity-95 text-white font-semibold px-6 py-2.5 transition shadow-lg shadow-brand-red/20 border-0 flex items-center gap-2 shrink-0"
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : sucessoSalvar ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Salvo com sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
