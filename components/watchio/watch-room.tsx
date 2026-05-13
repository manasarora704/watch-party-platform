"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Play, 
  Pause, 
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Users,
  MessageCircle,
  Send,
  Crown,
  Shield,
  User,
  Copy,
  Check,
  ArrowLeft,
  X,
  Settings,
  MoreVertical,
  Smile
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Participant {
  id: string
  name: string
  role: "host" | "moderator" | "participant"
  avatar: string
  color: string
  online: boolean
}

interface Message {
  id: string
  authorId: string
  authorName: string
  role: "host" | "moderator" | "participant"
  text: string
  timestamp: Date
  color: string
}

const mockParticipants: Participant[] = [
  { id: "1", name: "You", role: "host", avatar: "Y", color: "oklch(0.75 0.18 195)", online: true },
  { id: "2", name: "Alex", role: "moderator", avatar: "A", color: "oklch(0.65 0.25 330)", online: true },
  { id: "3", name: "Jordan", role: "participant", avatar: "J", color: "oklch(0.7 0.2 145)", online: true },
  { id: "4", name: "Sam", role: "participant", avatar: "S", color: "oklch(0.8 0.15 85)", online: true },
  { id: "5", name: "Taylor", role: "participant", avatar: "T", color: "oklch(0.6 0.2 280)", online: false },
]

const mockMessages: Message[] = [
  { id: "1", authorId: "2", authorName: "Alex", role: "moderator", text: "This episode is so good!", timestamp: new Date(Date.now() - 300000), color: "oklch(0.65 0.25 330)" },
  { id: "2", authorId: "3", authorName: "Jordan", role: "participant", text: "I can&apos;t believe that twist 😱", timestamp: new Date(Date.now() - 240000), color: "oklch(0.7 0.2 145)" },
  { id: "3", authorId: "1", authorName: "You", role: "host", text: "Told you it was worth watching!", timestamp: new Date(Date.now() - 180000), color: "oklch(0.75 0.18 195)" },
  { id: "4", authorId: "4", authorName: "Sam", role: "participant", text: "The cinematography is incredible", timestamp: new Date(Date.now() - 120000), color: "oklch(0.8 0.15 85)" },
]

function RoleBadge({ role }: { role: "host" | "moderator" | "participant" }) {
  if (role === "host") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">
        <Crown className="w-3 h-3" />
        Host
      </span>
    )
  }
  if (role === "moderator") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent">
        <Shield className="w-3 h-3" />
        Mod
      </span>
    )
  }
  return null
}

export function WatchRoom({ roomCode }: { roomCode: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(745) // 12:25
  const [duration] = useState(2180) // 36:20
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [participants] = useState<Participant[]>(mockParticipants)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev < duration ? prev + 1 : prev))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    const newMessage: Message = {
      id: Date.now().toString(),
      authorId: "1",
      authorName: "You",
      role: "host",
      text: message,
      timestamp: new Date(),
      color: "oklch(0.75 0.18 195)",
    }
    setMessages([...messages, newMessage])
    setMessage("")
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    setCurrentTime(Math.floor(percent * duration))
  }

  const onlineCount = participants.filter((p) => p.online).length

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 glass shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/rooms" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">Friday Movie Night</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{roomCode}</span>
              <button onClick={handleCopyCode} className="p-1 hover:text-foreground transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-chart-3" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
            <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse" />
            <span>{onlineCount} watching</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowParticipants(!showParticipants)}
            className={showParticipants ? "bg-secondary" : ""}
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChat(!showChat)}
            className={showChat ? "bg-secondary" : ""}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative bg-card/50 flex items-center justify-center group">
            {/* Mock video */}
            <div className="absolute inset-4 rounded-xl bg-card overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background/90 transition-all group-hover:scale-100 scale-90"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-foreground" />
                  ) : (
                    <Play className="w-8 h-8 text-foreground fill-foreground ml-1" />
                  )}
                </button>
              </div>

              {/* Video info overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
                  <span className="text-sm font-medium">Stranger Things S4E9</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="p-4 glass border-t border-border/50">
            {/* Progress Bar */}
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="h-1.5 bg-muted rounded-full mb-4 cursor-pointer group/progress"
            >
              <div
                className="h-full bg-primary rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 fill-current" />
                  )}
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                </div>
                <span className="text-sm text-muted-foreground font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {(showChat || showParticipants) && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-l border-border/50 flex flex-col glass overflow-hidden shrink-0"
            >
              {/* Tabs */}
              <div className="flex border-b border-border/50 shrink-0">
                <button
                  onClick={() => {
                    setShowChat(true)
                    setShowParticipants(false)
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    showChat && !showParticipants
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    setShowParticipants(true)
                    setShowChat(false)
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    showParticipants
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  People ({onlineCount})
                </button>
              </div>

              {/* Chat */}
              {showChat && !showParticipants && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                            style={{ background: msg.color }}
                          >
                            {msg.authorName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{msg.authorName}</span>
                              <RoleBadge role={msg.role} />
                              <span className="text-xs text-muted-foreground">
                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 break-words">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-border/50 shrink-0">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Send a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          className="pr-10 bg-input border-border/50 focus:border-primary"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              {showParticipants && (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{ background: participant.color }}
                          >
                            {participant.avatar}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                              participant.online ? "bg-chart-3" : "bg-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{participant.name}</span>
                            <RoleBadge role={participant.role} />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {participant.online ? "Online" : "Offline"}
                          </span>
                        </div>
                        {participant.id !== "1" && (
                          <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
