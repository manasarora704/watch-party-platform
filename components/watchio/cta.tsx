"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Play, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-background to-background" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/30 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Free forever. No credit card needed.</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            Ready to watch
            <br />
            <span className="text-gradient">together?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Start your first watch party in seconds. No sign-up, no downloads, no hassle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/rooms">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10 h-16 text-lg glow-primary">
                <Play className="w-5 h-5 fill-current" />
                Start a Watch Party
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" size="lg" className="gap-2 px-10 h-16 text-lg border-border/50 hover:bg-secondary">
                Join with Code
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3" />
              No sign-up required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3" />
              Works in any browser
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3" />
              100% free
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
