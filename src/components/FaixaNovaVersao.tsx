import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useVersionUpdate } from '@/contexts/VersionContext'
import { RefreshCw, AlertTriangle, Sparkles } from 'lucide-react'

export const FaixaNovaVersao: React.FC = () => {
  const { temNovaVersao, recarregarPagina } = useVersionUpdate()
  const location = useLocation()

  // Estado local para saber se há dados preenchidos / não salvos
  const [temDadosNaoSalvos, setTemDadosNaoSalvos] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.body.hasAttribute('data-form-dirty')
  })

  useEffect(() => {
    const handleDirtyChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ dirty: boolean }>
      if (customEvent.detail && typeof customEvent.detail.dirty === 'boolean') {
        setTemDadosNaoSalvos(customEvent.detail.dirty)
      } else {
        setTemDadosNaoSalvos(document.body.hasAttribute('data-form-dirty'))
      }
    }

    window.addEventListener('app:form-dirty', handleDirtyChange)
    return () => {
      window.removeEventListener('app:form-dirty', handleDirtyChange)
    }
  }, [])

  if (!temNovaVersao) {
    return null
  }

  const isCadastro = location.pathname.startsWith('/cadastro')
  const isAdmin = location.pathname.startsWith('/admin')

  // Se estiver em /cadastro e houver campos preenchidos, ou em /admin com alterações não salvas
  const exibirAlertaPerdaDados = (isCadastro || isAdmin) && temDadosNaoSalvos

  const mensagemTexto = exibirAlertaPerdaDados
    ? 'Uma nova versão está disponível. Ao atualizar, os dados preenchidos serão perdidos.'
    : 'Uma nova versão está disponível.'

  const handleAtualizar = () => {
    if (exibirAlertaPerdaDados) {
      const confirmar = window.confirm(
        'Você possui alterações não salvas que serão perdidas ao atualizar a página. Deseja recarregar agora?',
      )
      if (!confirmar) return
    }
    recarregarPagina()
  }

  return (
    <aside
      role="region"
      aria-label="Aviso de atualização"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      <div className="bg-[#121212]/95 border border-brand-orange/40 text-neutral-100 rounded-xl shadow-2xl backdrop-blur-md p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              exibirAlertaPerdaDados
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-brand-red/20 text-brand-orange border border-brand-orange/30'
            }`}
          >
            {exibirAlertaPerdaDados ? (
              <AlertTriangle className="w-4 h-4 animate-pulse text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-orange" />
            )}
          </div>
          <p className="text-xs sm:text-xs text-neutral-200 leading-snug line-clamp-3 sm:line-clamp-2">
            {mensagemTexto}
          </p>
        </div>

        <button
          onClick={handleAtualizar}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-brand hover:opacity-90 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-red/20 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap font-semibold">Atualizar agora</span>
        </button>
      </div>
    </aside>
  )
}
