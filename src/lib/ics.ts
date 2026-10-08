/**
 * Utilitário para geração de arquivos iCalendar (.ics) para adicionar eventos à agenda
 */

export interface IcsEventOptions {
  title: string
  description?: string
  location?: string
  startDate: string | Date
  endDate?: string | Date | null
  url?: string
}

function formatDateToIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

export function gerarArquivoIcs(options: IcsEventOptions): string {
  const start =
    typeof options.startDate === 'string' ? new Date(options.startDate) : options.startDate
  let end: Date
  if (options.endDate) {
    end = typeof options.endDate === 'string' ? new Date(options.endDate) : options.endDate
  } else {
    // Se não houver fim, padrão de 1 hora de duração
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  const dtStamp = formatDateToIcsUtc(new Date())
  const dtStart = formatDateToIcsUtc(start)
  const dtEnd = formatDateToIcsUtc(end)
  const uid = `evento-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@portal`

  let description = options.description || ''
  if (options.url) {
    description = description ? `${description}\n\nLink: ${options.url}` : `Link: ${options.url}`
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Credlar Vacation//Agenda//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(options.title)}`,
  ]

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
  }

  if (options.location) {
    lines.push(`LOCATION:${escapeIcsText(options.location)}`)
  }

  if (options.url) {
    lines.push(`URL:${options.url}`)
  }

  lines.push('STATUS:CONFIRMED')
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

export function baixarIcs(options: IcsEventOptions, filename?: string) {
  const icsContent = gerarArquivoIcs(options)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (filename || options.title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  a.download = `${safeName || 'evento'}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
