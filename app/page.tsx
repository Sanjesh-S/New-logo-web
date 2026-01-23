import { Suspense } from 'react'
import HeroSection from '@/components/HeroSection'
import BrandLogos from '@/components/BrandLogos'
import HowItWorksSection from '@/components/HowItWorksSection'
import TrustSection from '@/components/TrustSection'
import Testimonials from '@/components/Testimonials'
import FAQSection from '@/components/FAQSection'
import CTASection from '@/components/CTASection'
import Navigation from '@/components/Navigation'
import WhatsAppButton from '@/components/WhatsAppButton'
import MobileCTA from '@/components/MobileCTA'
import ReferralHandler from '@/components/ReferralHandler'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Suspense fallback={null}>
        <ReferralHandler />
      </Suspense>
      <HeroSection />
      <BrandLogos />
      <HowItWorksSection />
      <TrustSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
      <WhatsAppButton />
      <MobileCTA />
    </main>
  )
}
