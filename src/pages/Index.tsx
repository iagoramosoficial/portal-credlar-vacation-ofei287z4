import { Hero } from '@/components/Hero'
import { FeatureGrid } from '@/components/FeatureGrid'
import { Footer } from '@/components/Footer'

export default function Index() {
  return (
    <div className="w-full flex flex-col bg-brand-light min-h-screen font-sans overflow-x-hidden selection:bg-brand-red selection:text-white">
      <Hero />
      <FeatureGrid />
      <Footer />
    </div>
  )
}
