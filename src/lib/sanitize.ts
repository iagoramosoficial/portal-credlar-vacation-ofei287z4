/**
 * Sanitiza HTML para renderização segura prevenindo ataques XSS.
 * Remove tags <script>, <iframe>, <object>, <embed>, eventos inline (onclick, onerror, onload, etc.)
 * e esquemas javascript: em links.
 */
export function sanitizeHtml(htmlString: string | null | undefined): string {
  if (!htmlString) return ''

  if (typeof window === 'undefined') {
    // Fallback no ambiente SSR básico
    return htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

  const disallowedTags = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base']

  function cleanNode(node: Node) {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        const tagName = el.tagName.toLowerCase()

        if (disallowedTags.includes(tagName)) {
          el.remove()
          continue
        }

        // Remover atributos perigosos: on*, data-* com JS, href com javascript:
        const attributes = Array.from(el.attributes)
        for (const attr of attributes) {
          const name = attr.name.toLowerCase()
          const val = attr.value.trim().toLowerCase()

          if (name.startsWith('on')) {
            el.removeAttribute(attr.name)
          } else if (
            (name === 'href' || name === 'src' || name === 'action') &&
            (val.startsWith('javascript:') ||
              val.startsWith('data:text/html') ||
              val.startsWith('vbscript:'))
          ) {
            el.removeAttribute(attr.name)
          }
        }

        // Se for <a>, adicionar target e rel seguros
        if (tagName === 'a') {
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener noreferrer')
        }

        cleanNode(child)
      }
    }
  }

  cleanNode(doc.body)
  return doc.body.innerHTML
}
