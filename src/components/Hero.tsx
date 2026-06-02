import { Reveal } from '@/components/Reveal'
import { Diamond } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center bg-gradient-to-b from-brand-dark to-brand-darker overflow-hidden pt-20 pb-32">
      {/* Background textures */}
      <div className="absolute inset-0 z-0 bg-texture-pattern opacity-60" />

      <div className="container relative z-10 px-4 flex flex-col items-center text-center">
        <Reveal
          delay={100}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-16"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-elevation">
              <Diamond className="text-white w-8 h-8 fill-white" />
            </div>
            <h2 className="text-white font-black tracking-widest text-xl leading-none">CREDLAR</h2>
            <p className="text-white/80 tracking-[0.35em] text-[10px] mt-1 uppercase">Vacation</p>
          </div>

          <div className="hidden md:block w-px h-16 bg-white/20" />

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center mb-4 bg-white/5 backdrop-blur-sm">
              <span className="text-white font-bold text-3xl font-serif">U</span>
            </div>
            <h2 className="text-white font-black tracking-widest text-xl leading-none">
              UNICREDLAR
            </h2>
            <p className="text-white/80 tracking-[0.2em] text-[10px] mt-1 uppercase">Educação</p>
          </div>
        </Reveal>

        <Reveal delay={300} className="max-w-4xl mx-auto w-full">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase leading-[1.1] mb-8">
            Bem-vindo ao
            <br />
            <span className="text-gradient-brand drop-shadow-sm">Ecossistema Credlar</span>
          </h1>
        </Reveal>

        <Reveal delay={500}>
          <p className="font-script text-3xl sm:text-4xl md:text-5xl text-white/90 font-light">
            Seu veículo para a realização dos seus sonhos
          </p>
        </Reveal>
      </div>

      {/* Bottom wave transition to #FAFAFA */}
      <svg
        viewBox="0 0 1440 120"
        className="absolute bottom-0 w-full h-auto text-brand-light fill-current z-10"
        preserveAspectRatio="none"
      >
        <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
      </svg>
    </section>
  )
}
