/**
 * Converte um valor hexadecimal (#RGB ou #RRGGBB) para "R G B" em string decimal.
 * Retorna null se for inválido.
 */
export function hexToRgbChannels(hexStr: string | undefined | null): string | null {
  if (!hexStr) return null
  let hex = hexStr.trim()
  if (hex.startsWith('#')) {
    hex = hex.slice(1)
  }

  // 3 dígitos (#F00)
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return `${r} ${g} ${b}`
  }

  // 6 dígitos (#FF0000)
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return `${r} ${g} ${b}`
  }

  return null
}

export interface CoresTema {
  cor_primaria?: string
  cor_secundaria?: string
  cor_destaque?: string
  cor_lilas?: string
  cor_dourado?: string
  cor_fundo_escuro?: string
  cor_fundo_gradiente?: string
  cor_fundo_claro?: string
}

/**
 * Aplica as variáveis CSS :root no DOM de acordo com o objeto de cores.
 * Valores ausentes ou inválidos não sobrescrevem o CSS padrão.
 */
export function aplicarCoresCss(cores: CoresTema | undefined | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  const mapa: Array<{ prop: string; hex: string | undefined }> = [
    { prop: '--brand-red', hex: cores?.cor_primaria },
    { prop: '--brand-orange', hex: cores?.cor_secundaria },
    { prop: '--brand-yellow', hex: cores?.cor_destaque },
    { prop: '--brand-lilac', hex: cores?.cor_lilas },
    { prop: '--brand-gold', hex: cores?.cor_dourado },
    { prop: '--brand-dark', hex: cores?.cor_fundo_escuro },
    { prop: '--brand-darker', hex: cores?.cor_fundo_gradiente },
    { prop: '--brand-light', hex: cores?.cor_fundo_claro },
  ]

  for (const item of mapa) {
    const rgb = hexToRgbChannels(item.hex)
    if (rgb) {
      root.style.setProperty(item.prop, rgb)
    }
  }
}
