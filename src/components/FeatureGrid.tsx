import { Reveal } from '@/components/Reveal'
import { GraduationCap, MessageSquare, Folder, Calendar, Trophy, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CardHome, CARDS_PADRAO } from '@/lib/conteudo-padrao'
import { registrarClique } from '@/hooks/use-conteudo-site'

const ICON_MAP = {
  GraduationCap,
  MessageSquare,
  Folder,
  Calendar,
  Trophy,
  Heart,
}

interface FeatureGridProps {
  cards?: CardHome[]
}

export function FeatureGrid({ cards = CARDS_PADRAO }: FeatureGridProps) {
  const cardsList = cards.length > 0 ? cards : CARDS_PADRAO

  const handleCardClick = (card: CardHome) => {
    if (card.clicavel) {
      registrarClique(card.id, 'card')
    }
  }

  return (
    <section className="bg-brand-light py-24 md:py-32 relative z-0">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cardsList.map((card, index) => {
            const IconComponent = ICON_MAP[card.icone] || GraduationCap
            const isDisabled = !card.clicavel
            const iconColor =
              card.cor_icone === 'dourado' ? 'gold' : card.cor_icone === 'lilas' ? 'lilac' : null
            const badgeVariant =
              card.selo_estilo === 'amarelo'
                ? 'yellow'
                : card.selo_estilo === 'gradiente'
                  ? 'gradient'
                  : null
            const badgeText = card.selo_texto
            const href = card.link || '#'

            return (
              <Reveal key={card.id || index} delay={index * 100} className="h-full">
                <div
                  className={cn(
                    'group relative rounded-[16px] p-[2px] transition-all duration-300 h-full',
                    'bg-border hover:bg-gradient-brand hover:-translate-y-1 shadow-sm hover:shadow-elevation',
                    isDisabled
                      ? 'hover:bg-border hover:translate-y-0 shadow-none border border-border'
                      : '',
                  )}
                >
                  <div className="bg-white rounded-[14px] h-full p-6 sm:p-8 flex flex-col relative overflow-hidden">
                    <IconComponent
                      className={cn(
                        'absolute -top-4 -right-4 w-32 h-32 -rotate-12 transition-transform duration-500 group-hover:rotate-12',
                        iconColor === 'gold'
                          ? 'text-brand-gold/10'
                          : iconColor === 'lilac'
                            ? 'text-brand-lilac/10'
                            : 'text-gray-900/[0.04]',
                      )}
                    />

                    <div className="mb-6 flex justify-between items-start relative z-10">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center bg-gray-50 border transition-colors duration-300',
                          iconColor === 'lilac'
                            ? 'text-brand-lilac border-brand-lilac/20 group-hover:bg-brand-lilac/10'
                            : iconColor === 'gold'
                              ? 'text-brand-gold border-brand-gold/20 group-hover:bg-brand-gold/10'
                              : 'text-gray-700 group-hover:text-brand-red',
                        )}
                      >
                        <IconComponent className="w-7 h-7" strokeWidth={1.5} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10 uppercase font-sans tracking-wide">
                      {card.titulo}
                    </h3>

                    {badgeText && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'mb-4 w-fit text-[11px] uppercase tracking-wide',
                          badgeVariant === 'gradient'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-transparent hover:from-red-600 hover:to-orange-600'
                            : 'bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20 border-brand-yellow/20',
                        )}
                      >
                        {badgeText}
                      </Badge>
                    )}

                    <p className="text-gray-600 mb-8 relative z-10 flex-grow leading-relaxed">
                      {card.descricao}
                    </p>

                    <Button
                      className={cn(
                        'w-full mt-auto relative z-10 rounded-xl h-12 font-bold transition-all duration-300',
                        isDisabled
                          ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed border-none shadow-none'
                          : 'bg-gradient-brand text-white hover:opacity-90 shadow-md border-0 group-hover:shadow-lg',
                      )}
                      disabled={isDisabled}
                      asChild={!isDisabled}
                    >
                      {isDisabled ? (
                        <span>{card.texto_botao}</span>
                      ) : (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleCardClick(card)}
                        >
                          {card.texto_botao}
                        </a>
                      )}
                    </Button>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
