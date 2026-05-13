"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Users, Play, MessageCircle } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Create a Room",
    description: "Start a new watch party in seconds. No sign-up required. Get a unique room code to share.",
    color: "primary",
  },
  {
    number: "02",
    icon: Users,
    title: "Invite Friends",
    description: "Share your room code or link. Friends join instantly with just a name—no accounts needed.",
    color: "accent",
  },
  {
    number: "03",
    icon: Play,
    title: "Pick a Video",
    description: "Paste any YouTube URL or search. The host controls what plays, synced for everyone.",
    color: "chart-3",
  },
  {
    number: "04",
    icon: MessageCircle,
    title: "Watch & Chat",
    description: "Enjoy perfectly synced playback with live reactions. Every laugh, every moment—together.",
    color: "chart-4",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase mb-4 block">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Start watching in
            <br />
            <span className="text-gradient">under 30 seconds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            No complicated setup. No downloads. Just instant watch parties.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative group"
              >
                <div className="p-8 rounded-3xl glass hover:bg-card/80 transition-all duration-500">
                  {/* Step number */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl font-bold text-muted-foreground/30 font-mono">
                      {step.number}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl bg-${step.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <step.icon className={`w-7 h-7 text-${step.color}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {step.description}
                  </p>

                  {/* Arrow to next step */}
                  {index < steps.length - 1 && index % 2 === 0 && (
                    <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">
              Average time to first watch party: <span className="text-foreground font-semibold">23 seconds</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
