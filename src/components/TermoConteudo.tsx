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
 * Detecta se uma string contém qualquer tag HTML (mesmo simples ou mal formada).
 */
export function contemMarcacaoHtml(texto: string): boolean {
  return /<\s*[a-z][a-z0-9-]*\b[^>]*>/i.test(texto)
}

/**
 * Escapa caracteres HTML para uso seguro ao converter texto puro em HTML estruturado.
 */
export function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Converte quebras de linha de texto puro em parágrafos e quebras <br />:
 * - Quebras duplas (ou mais) => novo parágrafo <p>
 * - Quebras simples dentro do bloco => <br />
 */
export function converterTextoPuroParaParagrafos(textoPuro: string): string {
  const normalizado = textoPuro.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!normalizado) return ''

  const blocos = normalizado.split(/\n{2,}/)

  return blocos
    .map((bloco) => {
      const blocoTrim = bloco.trim()
      if (!blocoTrim) return ''
      const linhas = blocoTrim
        .split('\n')
        .map((linha) => escapeHtml(linha.trim()))
        .join('<br />')
      return `<p>${linhas}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Converte quebras de linha em nós de texto dentro de uma string com nós/marcações HTML.
 * Suporta conteúdo MISTO (ex: texto corrido com quebras de linha + listas <ul>/<li> no meio),
 * preservando a semântica das listas/tabelas/headings e envelopando texto solto em <p>.
 */
export function converterConteudoMistoParaHtml(conteudoHtml: string): string {
  if (typeof window === 'undefined') {
    // Ambiente sem DOMParser (SSR/Node básico): divide por tags de bloco estruturais
    return conteudoHtml
  }

  // Se o conteúdo bruto possuir quebras após tags de fechamento de bloco (ex: </ul>\n\n ou </li>\n),
  // DOMParser pode interpretar nós soltos entre tags ou colapsar.
  const parser = new DOMParser()
  const doc = parser.parseFromString(conteudoHtml, 'text/html')
  const body = doc.body

  // Tags de bloco reconhecidas onde nós soltos NÃO devem ser envelopados se já estiverem dentro delas
  const blockTagNames = new Set([
    'p',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'blockquote',
    'div',
    'section',
    'article',
    'header',
    'footer',
    'aside',
    'nav',
    'pre',
    'hr',
  ])

  // Processa recursivamente elementos internos de bloco (ex: <li> com quebras)
  function processarElementosDeBloco(parent: Node) {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        const tag = el.tagName.toLowerCase()

        // Se for <li> ou <td> ou <blockquote >, quebras duplas/simples dentro dele viram <br /> ou parágrafos
        if (tag === 'li' || tag === 'td' || tag === 'th') {
          processarQuebrasEmElementoInline(el)
        } else {
          processarElementosDeBloco(child)
        }
      }
    }
  }

  // Converte nós de texto dentro de um elemento folha ou sem blocos aninhados
  function processarQuebrasEmElementoInline(parent: HTMLElement) {
    const childNodes = Array.from(parent.childNodes)
    for (const child of childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const rawText = child.textContent || ''
        if (rawText.includes('\n')) {
          const normalizado = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
          const partes = normalizado.split('\n')
          const fragment = doc.createDocumentFragment()
          partes.forEach((parte, idx) => {
            if (idx > 0) {
              fragment.appendChild(doc.createElement('br'))
            }
            if (parte) {
              fragment.appendChild(doc.createTextNode(parte))
            }
          })
          parent.replaceChild(fragment, child)
        }
      }
    }
  }

  // Primeiro trata os elementos de bloco existentes (ex: listas, tabelas)
  processarElementosDeBloco(body)

  // Agora trata o nível superior (body) agrupando nós soltos/inline entre elementos de bloco
  const novosFilhos: Node[] = []
  let bufferInline: Node[] = []

  function flushInlineBuffer() {
    if (bufferInline.length === 0) return

    // Verifica se há apenas espaços vazios
    const textoTotal = bufferInline.map((n) => n.textContent || '').join('')
    if (!textoTotal.trim()) {
      bufferInline = []
      return
    }

    const fragment = doc.createDocumentFragment()
    bufferInline.forEach((n) => fragment.appendChild(n))
    bufferInline = []

    // Criar um container temporário para ler o HTML interno do buffer inline
    const tempDiv = doc.createElement('div')
    tempDiv.appendChild(fragment)
    const rawInlineHtml = tempDiv.innerHTML

    // Normalizar quebras de linha CRLF -> LF
    const normalizado = rawInlineHtml.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()

    // Dividir por quebras duplas (parágrafos)
    const paragrafos = normalizado.split(/\n{2,}/)

    for (const pStr of paragrafos) {
      const pTrim = pStr.trim()
      if (!pTrim) continue

      // Quebras simples dentro do parágrafo viram <br />
      const comBr = pTrim
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('<br />')

      if (comBr) {
        const pEl = doc.createElement('p')
        pEl.innerHTML = comBr
        novosFilhos.push(pEl)
      }
    }
  }

  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()

      if (blockTagNames.has(tag)) {
        flushInlineBuffer()
        novosFilhos.push(child)
      } else {
        // Elemento inline solto (ex: <strong>, <a>, <em>, <br>)
        bufferInline.push(child)
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      bufferInline.push(child)
    } else {
      novosFilhos.push(child)
    }
  }

  flushInlineBuffer()

  // Se nenhum filho foi gerado (ex: apenas texto puro já agrupado), novosFilhos terá todos os nós
  body.innerHTML = ''
  novosFilhos.forEach((n) => body.appendChild(n))

  return body.innerHTML
}

/**
 * Converte texto do termo para HTML estruturado e seguro:
 * 1. Texto puro (sem nenhuma tag HTML) => quebra dupla vira <p>, quebra simples vira <br />
 * 2. Conteúdo misto ou HTML puro => processa nós de texto preservando tags HTML (ex: <ul>/<li>),
 *    quebras duplas viram <p>, quebras simples viram <br />
 * 3. Aplica sanitização contra XSS (sanitizeHtml)
 */
export function formatarConteudoTermoParaHtml(conteudoBruto: string | null | undefined): string {
  if (!conteudoBruto) return ''

  const texto = conteudoBruto.trim()
  if (!texto) return ''

  let htmlBruto: string

  if (!contemMarcacaoHtml(texto)) {
    // Caso 1: Texto puro
    htmlBruto = converterTextoPuroParaParagrafos(texto)
  } else {
    // Caso 2 & 3: Conteúdo misto ou HTML puro
    htmlBruto = converterConteudoMistoParaHtml(texto)
  }

  // Sanitização final contra XSS e atributos inseguros
  return sanitizeHtml(htmlBruto)
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
