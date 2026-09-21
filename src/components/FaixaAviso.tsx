import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { ConfiguracoesSite } from '@/lib/conteudo-padrao'
import { estaNoPeriodoAviso } from '@/lib/timezone'

interface FaixaAvisoProps {
  config: ConfiguracoesSite
}

export function FaixaAviso({ config }: FaixaAvisoProps) {
  const deveExibir = useMemo(() => {
    if (!config.aviso_texto?.trim()) {
      return false
    }
    return estaNoPeriodoAviso(config.aviso_ativo, config.aviso_inicio, config.aviso_fim)
  }, [config.aviso_ativo, config.aviso_texto, config.aviso_inicio, config.aviso_fim])

  if (!deveExibir) {
    return null
  }

  const content = (
    <div className="w-full bg-gradient-brand text-white py-2 px-4 shadow-md transition-all text-xs sm:text-sm font-medium flex items-center justify-center text-center gap-2 relative z-50">
      <span>{config.aviso_texto}</span>
      {config.aviso_link && (
        <ExternalLink className="w-3.5 h-3.5 inline-block opacity-80 shrink-0" />
      )}
    </div>
  )

  if (config.aviso_link) {
    return (
      <a
        href={config.aviso_link}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-95 transition-opacity"
      >
        {content}
      </a>
    )
  }

  return content
}
