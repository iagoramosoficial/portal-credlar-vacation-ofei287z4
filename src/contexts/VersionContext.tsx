import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import versionInfo from '@/version-info.json'

// Intervalo de verificação padrão: 5 minutos
const INTERVALO_VERIFICACAO_MS = 5 * 60 * 1000

export interface VersionContextType {
  versaoCarregada: string
  versaoRemota: string | null
  temNovaVersao: boolean
  formularioAlterado: boolean
  setFormularioAlterado: (alterado: boolean) => void
  verificarAgora: () => Promise<void>
  recarregarPagina: () => void
}

const VersionContext = createContext<VersionContextType | undefined>(undefined)

interface VersionResponse {
  version?: string
  builtAt?: string
  timestamp?: number
}

export const VersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Versão local embutida no bundle
  const versaoCarregada = useMemo(() => {
    return versionInfo?.version || 'default-version'
  }, [])

  const [versaoRemota, setVersaoRemota] = useState<string | null>(null)
  const [temNovaVersao, setTemNovaVersao] = useState<boolean>(false)
  const [formularioAlterado, setFormularioAlterado] = useState<boolean>(false)

  // Evitar chamadas simultâneas
  const checandoRef = useRef(false)
  // Throttle de chamadas de foco/visibilidade (mínimo 15 segundos entre checagens)
  const ultimaChecagemRef = useRef<number>(0)

  const verificarNovaVersao = useCallback(async () => {
    if (checandoRef.current) return
    const agora = Date.now()
    if (agora - ultimaChecagemRef.current < 15000 && ultimaChecagemRef.current > 0) {
      return
    }

    checandoRef.current = true
    try {
      // Garantir que a requisição IGNORE totalmente cache:
      // 1. Query parameter de timestamp único na URL
      // 2. Cabeçalhos HTTP para prevenir cache em proxies/navegador
      // 3. Opção de fetch { cache: 'no-store' }
      const url = `/version.json?t=${agora}&_rnd=${Math.random().toString(36).substring(2, 9)}`
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          Accept: 'application/json',
        },
      })

      if (!res.ok) {
        // Falhas de rede ou status != 200 são ignoradas em silêncio
        return
      }

      const data: VersionResponse = await res.json()
      if (data && typeof data.version === 'string' && data.version.trim()) {
        const versaoPublicada = data.version.trim()
        setVersaoRemota(versaoPublicada)
        if (versaoPublicada !== versaoCarregada) {
          setTemNovaVersao(true)
        }
      }
    } catch {
      // Silenciosamente ignorado conforme especificação:
      // "Falhas na consulta são ignoradas em silêncio (sem aviso ao usuário)."
    } finally {
      ultimaChecagemRef.current = Date.now()
      checandoRef.current = false
    }
  }, [versaoCarregada])

  // Recarregar a página manualmente quando o usuário clica no botão
  const recarregarPagina = useCallback(() => {
    // Forçar recarregamento sem cache
    window.location.reload()
  }, [])

  useEffect(() => {
    // 1. Verificação inicial após montar a aplicação (com pequeno atraso para não concorrer com boot)
    const timerInicial = setTimeout(() => {
      verificarNovaVersao()
    }, 3000)

    // 2. Verificação periódica a cada 5 minutos
    const intervalId = setInterval(() => {
      verificarNovaVersao()
    }, INTERVALO_VERIFICACAO_MS)

    // 3. Sempre que a aba voltar a ficar visível ou em foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verificarNovaVersao()
      }
    }

    const handleWindowFocus = () => {
      verificarNovaVersao()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      clearTimeout(timerInicial)
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [verificarNovaVersao])

  return (
    <VersionContext.Provider
      value={{
        versaoCarregada,
        versaoRemota,
        temNovaVersao,
        formularioAlterado,
        setFormularioAlterado,
        verificarAgora: verificarNovaVersao,
        recarregarPagina,
      }}
    >
      {children}
    </VersionContext.Provider>
  )
}

export function useVersionUpdate(): VersionContextType {
  const context = useContext(VersionContext)
  if (!context) {
    throw new Error('useVersionUpdate deve ser utilizado dentro de um VersionProvider')
  }
  return context
}
