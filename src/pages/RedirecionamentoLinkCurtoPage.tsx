import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, Home, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

interface RedirectResponse {
  apelido: string
  destino: string
  message?: string
}

export const RedirecionamentoLinkCurtoPage: React.FC = () => {
  const { apelido } = useParams<{ apelido: string }>()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [destino, setDestino] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    async function resolverLink() {
      if (!apelido) {
        setErro('Identificador do link não foi informado.')
        setCarregando(false)
        return
      }

      try {
        const res = await pb.send<RedirectResponse>(
          `/backend/v1/r/${encodeURIComponent(apelido.toLowerCase())}`,
          {
            method: 'GET',
          },
        )

        if (!ativo) return

        if (res && res.destino) {
          setDestino(res.destino)
          // Redirecionamento instantâneo
          window.location.replace(res.destino)
        } else {
          setErro('Este link não foi encontrado ou está inativo.')
          setCarregando(false)
        }
      } catch (err: unknown) {
        if (!ativo) return
        const errObj = err as { message?: string; status?: number }
        if (errObj.status === 404) {
          setErro('O link solicitado não existe ou está temporariamente inativo.')
        } else {
          setErro(errObj.message || 'Não foi possível carregar este link. Verifique o endereço.')
        }
        setCarregando(false)
      }
    }

    resolverLink()

    return () => {
      ativo = false
    }
  }, [apelido])

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white font-sans selection:bg-brand-orange selection:text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-brand-orange/5 via-transparent to-transparent pointer-events-none" />

        {carregando ? (
          <div className="space-y-4 py-6">
            <Loader2 className="w-10 h-10 text-brand-orange animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white tracking-tight">Redirecionando...</h2>
            <p className="text-sm text-neutral-400">
              Você está sendo transferido para o endereço do link curto. Aguarde um instante...
            </p>
          </div>
        ) : erro ? (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-amber-500 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Link Indisponível</h2>
              <p className="text-sm text-neutral-300 leading-relaxed">{erro}</p>
            </div>

            <div className="pt-2">
              <Button
                asChild
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold rounded-xl shadow-md gap-2"
              >
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Ir para a Página Inicial
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-300">
              Caso não tenha sido redirecionado automaticamente, clique abaixo:
            </p>
            {destino && (
              <Button
                asChild
                className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold rounded-xl shadow-md gap-2"
              >
                <a href={destino} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Acessar {destino}
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RedirecionamentoLinkCurtoPage
