"use client"

import { motion } from "framer-motion"
import { 
  Play, 
  Users, 
  MessageCircle, 
  Shield, 
  Zap, 
  Globe,
  Crown,
  RefreshCcw
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant Sync",
    description: "Play, pause, and seek in perfect harmony. All participants stay locked to the same frame.",
    gradient: "from-primary to-primary/50",
  },
  {
    icon: Users,
    title: "Room-Based Parties",
    description: "Create private rooms with unique codes. Invite friends with a simple link or 6-digit code.",
    gradient: "from-accent to-accent/50",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Real-time chat with emoji reactions and GIF support. React together as moments happen.",
    gradient: "from-chart-3 to-chart-3/50",
  },
  {
    icon: Shield,
    title: "Role-Based Control",
    description: "Host, Moderator, and Participant roles. Control who can manage playback and room settings.",
    gradient: "from-chart-4 to-chart-4/50",
  },
  {
    icon: Crown,
    title: "Host Powers",
    description: "As host, you control the show. Assign moderators, remove users, and manage the room.",
    gradient: "from-primary to-accent",
  },
  {
    icon: RefreshCcw,
    title: "Auto-Reconnect",
    description: "Lost connection? We&apos;ve got you. Automatic reconnection keeps you in the party.",
    gradient: "from-chart-5 to-chart-5/50",
  },
  {
    icon: Globe,
    title: "No Downloads",
    description: "Works in your browser. No apps, no plugins. Just share a link and start watching.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Play,
    title: "YouTube Integration",
    description: "Full YouTube player with all controls. Search, queue, and watch any public video.",
    gradient: "from-chart-3 to-primary",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

export function Features() {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/5 rounded-full blur-[200px]" />
      
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
            Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Everything you need for
            <br />
            <span className="text-gradient">the perfect watch party</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Built for seamless real-time experiences. Powerful features that just work.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group relative p-6 rounded-2xl glass hover:bg-card/80 transition-all duration-500 cursor-default ${
                index === 0 || index === 5 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
