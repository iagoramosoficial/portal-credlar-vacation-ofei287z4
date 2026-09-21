import { Reveal } from '@/components/Reveal'
import credlarLogo from '@/assets/logo-vertical-negativo-branco-vacataion-28a59.png'
import unicredlarLogo from '@/assets/unicredlar-branco-ec4dd.png'

import { ConfiguracoesSite, CONFIGURACOES_PADRAO } from '@/lib/conteudo-padrao'

interface HeroProps {
  config?: ConfiguracoesSite
}

export function Hero({ config = CONFIGURACOES_PADRAO }: HeroProps) {
  const linha1 = config.hero_linha_1 || CONFIGURACOES_PADRAO.hero_linha_1
  const destaque = config.hero_destaque || CONFIGURACOES_PADRAO.hero_destaque
  const frase = config.hero_frase || CONFIGURACOES_PADRAO.hero_frase
  const nomeEmpresa = config.nome_empresa || CONFIGURACOES_PADRAO.nome_empresa

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center bg-gradient-to-b from-brand-dark to-brand-darker overflow-hidden pt-20 pb-32">
      {/* Background textures */}
      <div className="absolute inset-0 z-0 bg-texture-pattern opacity-60" />

      <div className="container relative z-10 px-4 flex flex-col items-center text-center">
        <Reveal
          delay={100}
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-16"
        >
          <div className="flex flex-col items-center justify-center w-48 h-24 sm:w-64 sm:h-32">
            <img
              src={credlarLogo}
              alt={nomeEmpresa}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          <div className="hidden md:block w-px h-24 bg-white/20" />

          <div className="flex flex-col items-center justify-center w-48 h-24 sm:w-64 sm:h-32">
            <img
              src={unicredlarLogo}
              alt="UniCredlar"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </Reveal>

        <Reveal delay={300} className="max-w-4xl mx-auto w-full">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase leading-[1.1] mb-8">
            {linha1}
            <br />
            <span className="text-gradient-brand drop-shadow-sm">{destaque}</span>
          </h1>
        </Reveal>

        <Reveal delay={500}>
          <p className="font-script text-3xl sm:text-4xl md:text-5xl text-white/90 font-light drop-shadow-sm">
            {frase}
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
