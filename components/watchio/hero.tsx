"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Play, Users, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 px-4">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary glow */}
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] animate-ambient" />
        {/* Accent glow */}
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[120px] animate-ambient" style={{ animationDelay: "-4s" }} />
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "100px 100px"
          }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Real-time synchronized watching</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-balance"
          >
            Watch Together.
            <br />
            <span className="text-gradient">Feel Together.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty"
          >
            Create instant watch parties with perfectly synchronized YouTube playback, 
            live chat, and seamless controls. No accounts needed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/rooms">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-lg glow-primary">
                <Play className="w-5 h-5 fill-current" />
                Start a Watch Party
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" size="lg" className="gap-2 px-8 h-14 text-lg border-border/50 hover:bg-secondary">
                Join with Code
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { icon: Users, value: "10K+", label: "Active Users" },
              { icon: Play, value: "50K+", label: "Watch Parties" },
              { icon: Zap, value: "<50ms", label: "Sync Latency" },
              { icon: Users, value: "100+", label: "Per Room" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="p-4 rounded-2xl glass group hover:bg-card/80 transition-all cursor-default"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Video Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden glass p-2">
            <div className="aspect-video rounded-xl bg-card/50 relative overflow-hidden">
              {/* Mock video player UI */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-primary/30 transition-colors group">
                  <Play className="w-8 h-8 text-primary fill-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
              
              {/* Participants overlay */}
              <div className="absolute top-4 right-4 flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-sm font-medium"
                    style={{
                      background: i === 1 ? "oklch(0.75 0.18 195)" : 
                                 i === 2 ? "oklch(0.65 0.25 330)" :
                                 i === 3 ? "oklch(0.7 0.2 145)" : "oklch(0.6 0.2 280)"
                    }}
                  >
                    {i === 4 ? "+5" : ["A", "B", "C"][i - 1]}
                  </div>
                ))}
              </div>

              {/* Live indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium">8 watching</span>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[35%] bg-primary rounded-full" />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>12:45</span>
                  <span>36:20</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
