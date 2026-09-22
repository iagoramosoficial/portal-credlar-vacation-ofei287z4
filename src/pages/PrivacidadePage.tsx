import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { pb } from '@/lib/pocketbase'
import { useConteudoSite } from '@/hooks/use-conteudo-site'
import { Footer } from '@/components/Footer'
import { TermoConteudo } from '@/components/TermoConteudo'
import credlarLogo from '@/assets/logo-vertical-negativo-branco-vacataion-28a59.png'

interface TermoPrivacidade {
  id: string
  titulo: string
  conteudo?: string
  vigente: boolean
  versao: number
  created: string
  updated: string
}

export const PrivacidadePage: React.FC = () => {
  const { config } = useConteudoSite()
  const [termo, setTermo] = useState<TermoPrivacidade | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function buscarTermo() {
      try {
        const record = await pb
          .collection('termos')
          .getFirstListItem<TermoPrivacidade>('tipo = "privacidade" && vigente = true')
        if (isMounted) {
          setTermo(record)
        }
      } catch {
        if (isMounted) {
          setTermo(null)
        }
      } finally {
        if (isMounted) {
          setCarregando(false)
        }
      }
    }

    buscarTermo()

    return () => {
      isMounted = false
    }
  }, [])

  // Obter logo do cliente ou padrão
  let logoSrc = credlarLogo
  if (config?.id && config?.logo_principal) {
    logoSrc = pb.files.getURL(config, config.logo_principal)
  }

  return (
    <div className="w-full flex flex-col bg-brand-light min-h-screen font-sans selection:bg-brand-red selection:text-white">
      {/* Topo escuro simples */}
      <header className="bg-brand-dark text-white border-b border-white/10 sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs md:text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-brand-orange" />
            <span>Voltar ao ecossistema</span>
          </Link>

          <Link to="/" className="h-8 flex items-center">
            <img
              src={logoSrc}
              alt={config?.nome_empresa || 'Credlar Vacation'}
              className="h-8 max-w-[140px] object-contain drop-shadow"
            />
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-subtle border border-neutral-200/80 p-6 md:p-12">
          {carregando ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Carregando termos de privacidade...</p>
            </div>
          ) : !termo ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Shield className="w-6 h-6 text-brand-orange" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-800">
                Aviso de Privacidade
              </h1>
              <p className="text-neutral-600 text-sm md:text-base">
                Aviso de privacidade em atualização.
              </p>
            </div>
          ) : (
            <article className="space-y-6">
              <div className="pb-6 border-b border-neutral-200">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Versão {termo.versao} (Vigente)
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  {termo.titulo}
                </h1>
              </div>

              {/* Renderização com HTML sanitizado e suporte a texto puro */}
              <TermoConteudo conteudo={termo.conteudo} variant="light" />
            </article>
          )}
        </div>
      </main>

      {/* Rodapé institucional padrão */}
      <Footer config={config} />
    </div>
  )
}
export default PrivacidadePage
