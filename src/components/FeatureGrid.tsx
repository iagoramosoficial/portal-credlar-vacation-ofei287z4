import { Reveal } from '@/components/Reveal'
import { GraduationCap, MessageSquare, Folder, Calendar, Trophy, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const cards = [
  {
    title: 'Plataforma UniCredlar',
    description:
      'Sua universidade corporativa. Acesse todos os cursos e trilhas de desenvolvimento preparadas para o seu crescimento profissional.',
    icon: GraduationCap,
    badge: 'Em Breve — Gravações a partir de Novembro/2026',
    button: 'Aguarde',
    disabled: true,
    href: '#',
    special: null,
  },
  {
    title: 'Deixe sua Sugestão',
    description:
      'Sua voz constrói o nosso futuro. Compartilhe suas ideias, críticas construtivas e sugestões de melhoria para o ecossistema.',
    icon: MessageSquare,
    button: 'Enviar Sugestão',
    disabled: false,
    href: 'https://forms.google.com',
    special: null,
  },
  {
    title: 'Materiais do Evento',
    description:
      'Acesse apostilas, slides e conteúdos exclusivos apresentados no Credlar Summit para revisar sempre que precisar.',
    icon: Folder,
    button: 'Acessar Drive',
    disabled: false,
    href: 'https://drive.google.com',
    special: null,
  },
  {
    title: 'Calendário UniCredlar',
    description:
      'Fique por dentro dos próximos encontros, terapias em grupo, workshops e eventos corporativos.',
    icon: Calendar,
    button: 'Ver Agenda',
    disabled: false,
    href: '#',
    special: null,
  },
  {
    title: 'Hall da Fama',
    description:
      'Reconhecimento àqueles que estão construindo um legado de excelência e resultados incríveis na Credlar.',
    icon: Trophy,
    button: 'Conhecer',
    disabled: false,
    href: '#',
    special: 'gold',
  },
  {
    title: 'Canal DHO Estratégico',
    description:
      'Apoio emocional, orientação de carreira e terapia corporativa voltada para o seu bem-estar completo.',
    icon: Heart,
    button: 'Falar com a DHO',
    disabled: false,
    href: '#',
    special: 'lilac',
  },
]

export function FeatureGrid() {
  return (
    <section className="bg-brand-light py-24 md:py-32 relative z-0">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <Reveal key={index} delay={index * 100} className="h-full">
              <div
                className={cn(
                  'group relative rounded-[16px] p-[2px] transition-all duration-300 h-full',
                  'bg-border hover:bg-gradient-brand hover:-translate-y-1 shadow-sm hover:shadow-elevation',
                  card.disabled
                    ? 'hover:bg-border hover:translate-y-0 shadow-none border border-border'
                    : '',
                )}
              >
                <div className="bg-white rounded-[14px] h-full p-6 sm:p-8 flex flex-col relative overflow-hidden">
                  {card.special === 'gold' && (
                    <Star className="absolute -top-4 -right-4 w-32 h-32 text-brand-gold/10 fill-brand-gold/10 -rotate-12 transition-transform duration-500 group-hover:rotate-12" />
                  )}
                  {card.special === 'lilac' && (
                    <Heart className="absolute -top-4 -right-4 w-32 h-32 text-brand-lilac/10 fill-brand-lilac/10 rotate-12 transition-transform duration-500 group-hover:-rotate-12" />
                  )}

                  <div className="mb-6 flex justify-between items-start relative z-10">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center bg-gray-50 border transition-colors duration-300',
                        card.special === 'lilac'
                          ? 'text-brand-lilac border-brand-lilac/20 group-hover:bg-brand-lilac/10'
                          : card.special === 'gold'
                            ? 'text-brand-gold border-brand-gold/20 group-hover:bg-brand-gold/10'
                            : 'text-gray-700 group-hover:text-brand-red',
                      )}
                    >
                      <card.icon className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10 uppercase font-sans tracking-wide">
                    {card.title}
                  </h3>

                  {card.badge && (
                    <Badge
                      variant="secondary"
                      className="mb-4 bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20 border-brand-yellow/20 w-fit text-[11px] uppercase tracking-wide"
                    >
                      {card.badge}
                    </Badge>
                  )}

                  <p className="text-gray-600 mb-8 relative z-10 flex-grow leading-relaxed">
                    {card.description}
                  </p>

                  <Button
                    className={cn(
                      'w-full mt-auto relative z-10 rounded-xl h-12 font-bold transition-all duration-300',
                      card.disabled
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed border-none shadow-none'
                        : 'bg-gradient-brand text-white hover:opacity-90 shadow-md border-0 group-hover:shadow-lg',
                    )}
                    disabled={card.disabled}
                    asChild={!card.disabled}
                  >
                    {card.disabled ? (
                      <span>{card.button}</span>
                    ) : (
                      <a href={card.href} target="_blank" rel="noopener noreferrer">
                        {card.button}
                      </a>
                    )}
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
