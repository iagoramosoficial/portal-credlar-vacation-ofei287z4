/**
 * Configuração de Fuso Horário do Projeto.
 *
 * DEFINIDO EM UM ÚNICO LUGAR:
 * Centralizado e configurável pelo banco (configuracoes_site.fuso_horario).
 * Fallback permanente: 'America/Sao_Paulo'.
 */
export let APP_TIMEZONE = 'America/Sao_Paulo'
export const APP_LOCALE = 'pt-BR'

export function setAppTimezone(novoFuso: string | undefined | null) {
  if (novoFuso && novoFuso.trim()) {
    try {
      // Testar se é um timezone válido
      Intl.DateTimeFormat(undefined, { timeZone: novoFuso.trim() })
      APP_TIMEZONE = novoFuso.trim()
    } catch {
      APP_TIMEZONE = 'America/Sao_Paulo'
    }
  } else {
    APP_TIMEZONE = 'America/Sao_Paulo'
  }
}

/**
 * Formata uma data UTC vinda do banco ou timestamp ISO para exibição no fuso horário da aplicação.
 * Formato padrão: DD/MM/AAAA HH:MM
 */
export function formatarDataHora(
  dateInput: string | Date | null | undefined,
  incluirSegundos: boolean = false,
): string {
  if (!dateInput) return '-'

  const data = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(data.getTime())) return '-'

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: APP_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    if (incluirSegundos) {
      options.second = '2-digit'
    }

    return new Intl.DateTimeFormat(APP_LOCALE, options).format(data)
  } catch {
    return '-'
  }
}

/**
 * Formata apenas a data DD/MM/AAAA no fuso horário da aplicação.
 */
export function formatarApenasData(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'

  const data = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(data.getTime())) return '-'

  try {
    return new Intl.DateTimeFormat(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(data)
  } catch {
    return '-'
  }
}

/**
 * Converte uma data e hora no fuso horário da aplicação (ex: "2026-09-30 23:59:59")
 * para string ISO UTC adequada para salvar no banco SQLite / PocketBase.
 */
export function dateStringToUtcIso(
  dateStr: string | null | undefined,
  isEndOfDay: boolean = false,
): string {
  if (!dateStr || !dateStr.trim()) return ''

  // Se já for uma data ISO completa (com T ou espaço com hora)
  let year = 0
  let month = 0
  let day = 0
  let hour = isEndOfDay ? 23 : 0
  let minute = isEndOfDay ? 59 : 0
  let second = isEndOfDay ? 59 : 0

  if (dateStr.includes('T')) {
    const [dPart, tPart] = dateStr.split('T')
    const [y, m, d] = dPart.split('-').map(Number)
    year = y
    month = m
    day = d
    if (tPart) {
      const [h, min, s] = tPart.split(':').map((v) => Number(v.replace('Z', '')) || 0)
      hour = h
      minute = min
      second = s || 0
    }
  } else if (dateStr.includes(' ')) {
    const [dPart, tPart] = dateStr.split(' ')
    const [y, m, d] = dPart.split('-').map(Number)
    year = y
    month = m
    day = d
    if (tPart) {
      const [h, min, s] = tPart.split(':').map(Number)
      hour = h
      minute = min
      second = s || 0
    }
  } else if (dateStr.includes('-')) {
    // Formato YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number)
    year = y
    month = m
    day = d
  } else {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString()
  }

  // Cria data assumindo o offset de America/Sao_Paulo (UTC-3 fixo no Brasil atualmente)
  // Calcula offset exato do fuso configurado para o instante desejado
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(utcGuess)

  const tzObj: Record<string, number> = {}
  for (const part of tzParts) {
    if (part.type !== 'literal') {
      tzObj[part.type] = Number(part.value)
    }
  }

  const asTzDate = new Date(
    Date.UTC(
      tzObj.year,
      tzObj.month - 1,
      tzObj.day,
      tzObj.hour === 24 ? 0 : tzObj.hour,
      tzObj.minute,
      tzObj.second,
    ),
  )

  const offsetMs = asTzDate.getTime() - utcGuess.getTime()
  const realUtcTime = utcGuess.getTime() - offsetMs
  return new Date(realUtcTime).toISOString()
}

/**
 * Converte valor UTC do banco para string 'YYYY-MM-DDTHH:mm' ou 'YYYY-MM-DD'
 * nos inputs HTML baseados no fuso configurado.
 */
export function utcToLocalInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(d)
  } catch {
    return ''
  }
}

/**
 * Converte valor UTC do banco para string 'YYYY-MM-DDTHH:mm' no fuso configurado.
 */
export function utcToLocalInputDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d)

    const map: Record<string, string> = {}
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = p.value
      }
    }
    const hour = map.hour === '24' ? '00' : map.hour
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`
  } catch {
    return ''
  }
}

/**
 * Verifica se a data atual está dentro do intervalo de início e fim da faixa de aviso,
 * considerando o fuso horário configurado e a regra de fim de dia para aviso_fim.
 */
export function estaNoPeriodoAviso(
  avisoAtivo: boolean | undefined | null,
  avisoInicio: string | null | undefined,
  avisoFim: string | null | undefined,
): boolean {
  if (!avisoAtivo) return false

  const agora = Date.now()

  if (avisoInicio && avisoInicio.trim()) {
    // Se for apenas YYYY-MM-DD, início do dia no fuso
    const inicioUtc =
      avisoInicio.includes('T') || avisoInicio.includes(' ')
        ? new Date(avisoInicio).getTime()
        : new Date(dateStringToUtcIso(avisoInicio, false)).getTime()

    if (!isNaN(inicioUtc) && agora < inicioUtc) {
      return false
    }
  }

  if (avisoFim && avisoFim.trim()) {
    // Se for apenas YYYY-MM-DD, fim do dia (23:59:59.999) no fuso
    const fimUtc =
      avisoFim.includes('T') || avisoFim.includes(' ')
        ? new Date(avisoFim).getTime()
        : new Date(dateStringToUtcIso(avisoFim, true)).getTime()

    if (!isNaN(fimUtc) && agora > fimUtc) {
      return false
    }
  }

  return true
}
