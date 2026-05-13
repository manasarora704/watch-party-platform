"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    content: "Finally, a watch party app that actually syncs properly. My friends and I use it every movie night. The latency is unreal.",
    author: "Sarah K.",
    role: "Movie Night Host",
    avatar: "SK",
    color: "oklch(0.75 0.18 195)",
  },
  {
    content: "We use Watchio for our long-distance relationship movie dates. It feels like we're actually in the same room. Life-changing.",
    author: "Marcus T.",
    role: "Long-Distance Partner",
    avatar: "MT",
    color: "oklch(0.65 0.25 330)",
  },
  {
    content: "The role system is perfect for our anime club. Mods can control playback while everyone else just vibes and chats.",
    author: "Yuki N.",
    role: "Anime Club Admin",
    avatar: "YN",
    color: "oklch(0.7 0.2 145)",
  },
  {
    content: "No sign-up, no downloads, no BS. Just paste a link and watch. This is how all streaming apps should work.",
    author: "Alex R.",
    role: "Tech Enthusiast",
    avatar: "AR",
    color: "oklch(0.8 0.15 85)",
  },
  {
    content: "The chat with GIFs and reactions makes it so fun. We laugh at the same moments even though we're continents apart.",
    author: "Chen W.",
    role: "International Friend Group",
    avatar: "CW",
    color: "oklch(0.6 0.2 280)",
  },
  {
    content: "Used it to watch the season finale with my college friends. Zero lag, perfect sync. We were all screaming in chat together.",
    author: "Jordan P.",
    role: "Series Binge Watcher",
    avatar: "JP",
    color: "oklch(0.75 0.18 195)",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />

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
            Community
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Loved by watchers
            <br />
            <span className="text-gradient">around the world</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of happy users who watch together every day.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 rounded-2xl glass hover:bg-card/80 transition-all duration-500 group"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-chart-4 fill-chart-4"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-primary-foreground"
                  style={{ background: testimonial.color }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 flex flex-wrap justify-center gap-8 lg:gap-16"
        >
          {[
            { value: "4.9", label: "App Store Rating" },
            { value: "50K+", label: "Monthly Parties" },
            { value: "120+", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gradient">{stat.value}</div>
              <div className="text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
