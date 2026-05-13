import { Navbar } from "@/components/watchio/navbar"
import { Hero } from "@/components/watchio/hero"
import { Features } from "@/components/watchio/features"
import { HowItWorks } from "@/components/watchio/how-it-works"
import { Testimonials } from "@/components/watchio/testimonials"
import { CTA } from "@/components/watchio/cta"
import { Footer } from "@/components/watchio/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
