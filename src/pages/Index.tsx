import { Hero } from '@/components/Hero'
import { FeatureGrid } from '@/components/FeatureGrid'
import { Footer } from '@/components/Footer'
import { FaixaAviso } from '@/components/FaixaAviso'
import { useConteudoSite } from '@/hooks/use-conteudo-site'

export default function Index() {
  const { config, cards } = useConteudoSite()

  return (
    <div className="w-full flex flex-col bg-brand-light min-h-screen font-sans overflow-x-hidden selection:bg-brand-red selection:text-white">
      <FaixaAviso config={config} />
      <Hero config={config} />
      <FeatureGrid cards={cards} />
      <Footer config={config} />
    </div>
  )
}
