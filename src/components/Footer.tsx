import { Reveal } from '@/components/Reveal'
import xdreamsLogo from '@/assets/xdreams-advisory-fundo-preto-30871.png'

export function Footer() {
  return (
    <footer className="relative bg-brand-dark text-white pt-32 pb-16 overflow-hidden mt-[-1px]">
      {/* Top wave transition from #FAFAFA */}
      <svg
        viewBox="0 0 1440 120"
        className="absolute top-0 left-0 w-full h-auto text-brand-light fill-current rotate-180 transform origin-center -translate-y-[1px]"
        preserveAspectRatio="none"
      >
        <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
      </svg>

      <div className="container relative z-10 px-4 text-center flex flex-col items-center">
        <Reveal delay={100}>
          <div className="mb-6 opacity-80 flex flex-col items-center select-none hover:opacity-100 transition-opacity duration-500">
            <img
              src={xdreamsLogo}
              alt="XDreams Advisory"
              className="h-10 md:h-12 w-auto object-contain rounded-sm mix-blend-lighten"
            />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-white/60 text-xs md:text-sm max-w-md mx-auto mb-16 uppercase tracking-widest leading-relaxed">
            Em parceria estratégica com XDreams Advisory
            <br />
            <span className="opacity-80 font-bold">Governança e Metodologia LPP</span>
          </p>
        </Reveal>

        <Reveal delay={300} className="w-full">
          <div className="w-full max-w-3xl mx-auto px-4 py-8 border-t border-white/10 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-brand-yellow/50" />
            <p className="font-script text-3xl md:text-4xl lg:text-5xl text-white/90 font-light leading-relaxed">
              A Credlar Vacation é o veículo para a realização dos seus sonhos.
              <br className="hidden md:block" /> Mas é você quem está no volante.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Decorative ocean waves at the bottom */}
      <div className="absolute bottom-0 left-0 w-full opacity-5 pointer-events-none translate-y-1/3">
        <svg viewBox="0 0 1440 320" className="w-full h-auto fill-white" preserveAspectRatio="none">
          <path d="M0,160L48,165.3C96,171,192,181,288,165.3C384,149,480,107,576,112C672,117,768,171,864,186.7C960,203,1056,181,1152,149.3C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </footer>
  )
}
