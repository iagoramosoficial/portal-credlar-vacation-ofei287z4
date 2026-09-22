import React, { useMemo } from 'react'
import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

interface TermoConteudoProps {
  /**
   * Conteúdo bruto do termo (pode ser texto puro com quebras de linha ou marcações HTML).
   */
  conteudo: string | null | undefined
  /**
   * Classes extras para o contêiner.
   */
  className?: string
  /**
   * Esquema de cores:
   * - 'light': fundo claro (ex: /privacidade, /cadastro/:token, prévias claras)
   * - 'dark': fundo escuro (ex: modal escuro do painel admin)
   * Padrão: 'light'
   */
  variant?: 'light' | 'dark'
}

/**
 * Detecta se uma string contém marcações HTML estruturais de bloco ou formatação rica.
 */
function contemMarcacaoHtml(texto: string): boolean {
  return /<\s*(p|div|ul|ol|li|h[1-6]|table|br|blockquote|section|article)\b[^>]*>/i.test(texto)
}

/**
 * Escapa caracteres HTML para uso seguro ao converter texto puro em HTML estruturado.
 */
function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Converte texto puro em HTML estruturado:
 * - Quebras duplas (ou mais) => novo parágrafo <p>
 * - Quebras simples dentro do bloco => <br />
 * Se o texto já tiver marcações HTML estruturais (<p>, <ul>, etc.), retorna o texto original.
 */
export function formatarConteudoTermoParaHtml(conteudoBruto: string | null | undefined): string {
  if (!conteudoBruto) return ''

  const texto = conteudoBruto.trim()
  if (!texto) return ''

  // Se já tiver tags HTML de bloco/estrutura, preserva
  if (contemMarcacaoHtml(texto)) {
    return sanitizeHtml(texto)
  }

  // Normalizar quebras de linha CRLF -> LF
  const normalizado = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Dividir por duas ou mais quebras de linha (parágrafos)
  const blocos = normalizado.split(/\n{2,}/)

  const paragrafosHtml = blocos
    .map((bloco) => {
      const blocoTrim = bloco.trim()
      if (!blocoTrim) return ''
      // Escapa caracteres especiais e converte quebra simples em <br />
      const linhas = blocoTrim
        .split('\n')
        .map((linha) => escapeHtml(linha.trim()))
        .join('<br />')
      return `<p>${linhas}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return sanitizeHtml(paragrafosHtml)
}

/**
 * Componente único de exibição dos termos legais.
 * Garante tipografia legível (mínimo 15px em telas pequenas),
 * espaçamento confortável entre parágrafos, marcadores para listas,
 * títulos e negritos destacados, links sublinhados e sanitização contra XSS.
 */
export const TermoConteudo: React.FC<TermoConteudoProps> = ({
  conteudo,
  className,
  variant = 'light',
}) => {
  const htmlProcessado = useMemo(() => {
    return formatarConteudoTermoParaHtml(conteudo)
  }, [conteudo])

  if (!htmlProcessado) {
    return (
      <p
        className={cn(
          'text-sm italic',
          variant === 'dark' ? 'text-neutral-500' : 'text-neutral-400',
        )}
      >
        Nenhum conteúdo disponível para este termo.
      </p>
    )
  }

  return (
    <div
      className={cn(
        // Base tipográfica (mínimo 15px no celular)
        'termo-conteudo text-[15px] sm:text-base leading-relaxed',
        // Estilos para parágrafos
        '[&>p]:mb-4 [&>p:last-child]:mb-0',
        // Títulos destacados
        '[&_h1]:text-xl sm:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3',
        '[&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2.5',
        '[&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2',
        '[&_h4]:text-[15px] sm:[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-2',
        // Negrito e ênfase
        '[&_strong]:font-bold [&_b]:font-bold',
        // Listas com marcadores e recuo visível
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3.5 [&_ul]:space-y-1.5',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3.5 [&_ol]:space-y-1.5',
        '[&_li]:leading-relaxed',
        // Links com sublinhado e contraste
        '[&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium transition-colors',
        // Citações / blockquotes
        '[&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4',
        // Variação clara
        variant === 'light' && [
          'text-neutral-800',
          '[&_p]:text-neutral-800',
          '[&_li]:text-neutral-800',
          '[&_h1]:text-neutral-900 [&_h2]:text-neutral-900 [&_h3]:text-neutral-900 [&_h4]:text-neutral-900',
          '[&_strong]:text-neutral-950 [&_b]:text-neutral-950',
          '[&_a]:text-brand-orange hover:[&_a]:text-brand-red',
          '[&_blockquote]:border-brand-orange/40 [&_blockquote]:text-neutral-600',
        ],
        // Variação escura (para modais/painel escuro)
        variant === 'dark' && [
          'text-neutral-200',
          '[&_p]:text-neutral-200',
          '[&_li]:text-neutral-200',
          '[&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white',
          '[&_strong]:text-white [&_b]:text-white',
          '[&_a]:text-brand-orange hover:[&_a]:text-brand-yellow',
          '[&_blockquote]:border-neutral-700 [&_blockquote]:text-neutral-400',
        ],
        className,
      )}
      dangerouslySetInnerHTML={{ __html: htmlProcessado }}
    />
  )
}

export default TermoConteudo
