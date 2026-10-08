import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Clock } from 'lucide-react'
import { EventoItem } from '@/services/adminService'
import { APP_TIMEZONE } from '@/lib/timezone'

interface FaixaContagemEventoProps {
  evento: EventoItem
}

interface TempoRestante {
  dias: number
  horas: number
  minutos: number
  ehHoje: boolean
  passou: boolean
}

function calcularTempoRestante(dataHoraInicioStr: string): TempoRestante {
  const agora = new Date()
  const dataEvento = new Date(dataHoraInicioStr)

  if (isNaN(dataEvento.getTime())) {
    return { dias: 0, horas: 0, minutos: 0, ehHoje: false, passou: true }
  }

  // Obter data no formato YYYY-MM-DD no fuso configurado
  const formatarDiaTz = (d: Date) => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d)
      return parts
    } catch {
      return d.toISOString().split('T')[0]
    }
  }

  const diaHoje = formatarDiaTz(agora)
  const diaEvento = formatarDiaTz(dataEvento)

  const ehHoje = diaHoje === diaEvento

  const diffMs = dataEvento.getTime() - agora.getTime()
  if (diffMs <= 0 && !ehHoje) {
    return { dias: 0, horas: 0, minutos: 0, ehHoje: false, passou: true }
  }

  const minutosTotal = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  const dias = Math.floor(minutosTotal / (60 * 24))
  const horas = Math.floor((minutosTotal % (60 * 24)) / 60)
  const minutos = minutosTotal % 60

  return {
    dias,
    horas,
    minutos,
    ehHoje,
    passou: diffMs < -4 * 60 * 60 * 1000 && !ehHoje, // consider tolerância
  }
}

export const FaixaContagemEvento: React.FC<FaixaContagemEventoProps> = ({ evento }) => {
  const [tempo, setTempo] = useState<TempoRestante>(() =>
    calcularTempoRestante(evento.data_hora_inicio),
  )

  useEffect(() => {
    // Atualizar a cada 30 segundos
    const timer = setInterval(() => {
      setTempo(calcularTempoRestante(evento.data_hora_inicio))
    }, 30000)

    return () => clearInterval(timer)
  }, [evento.data_hora_inicio])

  if (tempo.passou) {
    return null
  }

  return (
    <div className="w-full bg-neutral-950 border-b border-neutral-800 text-white py-2.5 px-4 shadow-md transition-all relative z-45">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 text-[11px] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-brand-orange" />
            Próximo Evento
          </span>

          <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
            {evento.titulo}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            {tempo.ehHoje ? (
              <span className="text-brand-orange font-bold px-2 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20 animate-pulse">
                É hoje!
              </span>
            ) : (
              <span>
                Faltam{' '}
                <strong className="text-white font-bold">
                  {tempo.dias > 0 && `${tempo.dias}d `}
                  {tempo.horas}h {tempo.minutos}m
                </strong>
              </span>
            )}
          </div>

          <Link
            to="/agenda"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:text-white transition-colors"
          >
            <span>Ver detalhes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
export default FaixaContagemEvento
