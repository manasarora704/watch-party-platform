"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Users,
  MessageCircle,
  Send,
  Crown,
  Shield,
  User,
  Copy,
  Check,
  ArrowLeft,
  Settings,
  MoreVertical,
  Smile,
  Link2,
  UserPlus,
  ShieldPlus,
  UserMinus,
  Play,
  Video
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type Role = "host" | "moderator" | "participant"

interface Participant {
  id: string
  name: string
  role: Role
  avatar: string
  color: string
  online: boolean
}

interface Message {
  id: string
  authorId: string
  authorName: string
  role: Role
  text: string
  timestamp: Date
  color: string
  type: "chat" | "system"
}

const initialParticipants: Participant[] = [
  { id: "1", name: "You", role: "host", avatar: "Y", color: "oklch(0.75 0.18 195)", online: true },
  { id: "2", name: "Alex", role: "moderator", avatar: "A", color: "oklch(0.65 0.25 330)", online: true },
  { id: "3", name: "Jordan", role: "participant", avatar: "J", color: "oklch(0.7 0.2 145)", online: true },
  { id: "4", name: "Sam", role: "participant", avatar: "S", color: "oklch(0.8 0.15 85)", online: true },
  { id: "5", name: "Taylor", role: "participant", avatar: "T", color: "oklch(0.6 0.2 280)", online: false },
]

const initialMessages: Message[] = [
  { id: "1", authorId: "2", authorName: "Alex", role: "moderator", text: "This video is so good!", timestamp: new Date(Date.now() - 300000), color: "oklch(0.65 0.25 330)", type: "chat" },
  { id: "2", authorId: "3", authorName: "Jordan", role: "participant", text: "I can't believe that twist", timestamp: new Date(Date.now() - 240000), color: "oklch(0.7 0.2 145)", type: "chat" },
  { id: "3", authorId: "1", authorName: "You", role: "host", text: "Told you it was worth watching!", timestamp: new Date(Date.now() - 180000), color: "oklch(0.75 0.18 195)", type: "chat" },
]

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function RoleBadge({ role }: { role: Role }) {
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
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
      <User className="w-3 h-3" />
      Viewer
    </span>
  )
}

function RoleIcon({ role }: { role: Role }) {
  if (role === "host") return <Crown className="w-4 h-4 text-primary" />
  if (role === "moderator") return <Shield className="w-4 h-4 text-accent" />
  return <User className="w-4 h-4 text-muted-foreground" />
}

export function WatchRoom({ roomCode }: { roomCode: string }) {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ") // Default video
  const [videoUrl, setVideoUrl] = useState("")
  const [showChangeVideo, setShowChangeVideo] = useState(false)
  const [urlError, setUrlError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [currentUserId] = useState("1") // Current user is "You"
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentUser = participants.find(p => p.id === currentUserId)
  const canChangeVideo = currentUser?.role === "host" || currentUser?.role === "moderator"
  const canManageRoles = currentUser?.role === "host"

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addSystemMessage = useCallback((text: string) => {
    const systemMsg: Message = {
      id: Date.now().toString(),
      authorId: "system",
      authorName: "System",
      role: "participant",
      text,
      timestamp: new Date(),
      color: "oklch(0.5 0 0)",
      type: "system"
    }
    setMessages(prev => [...prev, systemMsg])
  }, [])

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return
    const newMessage: Message = {
      id: Date.now().toString(),
      authorId: currentUserId,
      authorName: currentUser.name,
      role: currentUser.role,
      text: message,
      timestamp: new Date(),
      color: currentUser.color,
      type: "chat"
    }
    setMessages(prev => [...prev, newMessage])
    setMessage("")
  }

  const handleChangeVideo = () => {
    if (!canChangeVideo) return
    
    const id = extractYouTubeId(videoUrl.trim())
    if (!id) {
      setUrlError("Please enter a valid YouTube URL or video ID")
      return
    }
    
    setVideoId(id)
    setShowChangeVideo(false)
    setVideoUrl("")
    setUrlError("")
    addSystemMessage(`${currentUser?.name} changed the video`)
  }

  const handlePromoteToModerator = (participantId: string) => {
    if (!canManageRoles) return
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, role: "moderator" as Role } : p
    ))
    const participant = participants.find(p => p.id === participantId)
    if (participant) {
      addSystemMessage(`${currentUser?.name} promoted ${participant.name} to Moderator`)
    }
  }

  const handlePromoteToHost = (participantId: string) => {
    if (!canManageRoles) return
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) return { ...p, role: "host" as Role }
      if (p.id === currentUserId) return { ...p, role: "moderator" as Role }
      return p
    }))
    const participant = participants.find(p => p.id === participantId)
    if (participant) {
      addSystemMessage(`${currentUser?.name} transferred host to ${participant.name}`)
    }
  }

  const handleDemoteToViewer = (participantId: string) => {
    if (!canManageRoles) return
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, role: "participant" as Role } : p
    ))
    const participant = participants.find(p => p.id === participantId)
    if (participant) {
      addSystemMessage(`${currentUser?.name} changed ${participant.name} to Viewer`)
    }
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
            <h1 className="font-semibold text-foreground">Watch Party</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{roomCode}</span>
              <button onClick={handleCopyCode} className="p-1 hover:text-foreground transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-chart-3" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Change Video Button - Only for Host/Moderator */}
          {canChangeVideo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangeVideo(true)}
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Video className="w-4 h-4" />
              Change Video
            </Button>
          )}
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
            <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse" />
            <span>{onlineCount} watching</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowParticipants(!showParticipants)
              if (!showParticipants) setShowChat(false)
            }}
            className={showParticipants ? "bg-secondary" : ""}
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowChat(!showChat)
              if (!showChat) setShowParticipants(false)
            }}
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
        <div className="flex-1 flex flex-col bg-black">
          {/* YouTube Iframe Container */}
          <div className="flex-1 relative">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Role indicator bar */}
          <div className="px-4 py-2 bg-card/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <RoleIcon role={currentUser?.role || "participant"} />
                <span className="text-sm text-muted-foreground">
                  You are {currentUser?.role === "host" ? "the Host" : currentUser?.role === "moderator" ? "a Moderator" : "a Viewer"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {canChangeVideo ? (
                <span className="flex items-center gap-1.5 text-chart-3">
                  <Check className="w-3.5 h-3.5" />
                  Can change video
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Watch only
                </span>
              )}
              {canManageRoles && (
                <span className="flex items-center gap-1.5 text-primary">
                  <Crown className="w-3.5 h-3.5" />
                  Can manage roles
                </span>
              )}
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
                        <div key={msg.id}>
                          {msg.type === "system" ? (
                            <div className="text-center py-2">
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                {msg.text}
                              </span>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 text-white"
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
                          )}
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
                  <div className="space-y-1">
                    {/* Section: Host */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                        Host
                      </h3>
                      {participants.filter(p => p.role === "host").map((participant) => (
                        <ParticipantItem
                          key={participant.id}
                          participant={participant}
                          currentUserId={currentUserId}
                          canManageRoles={canManageRoles}
                          onPromoteToModerator={handlePromoteToModerator}
                          onPromoteToHost={handlePromoteToHost}
                          onDemoteToViewer={handleDemoteToViewer}
                        />
                      ))}
                    </div>

                    {/* Section: Moderators */}
                    {participants.some(p => p.role === "moderator") && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                          Moderators
                        </h3>
                        {participants.filter(p => p.role === "moderator").map((participant) => (
                          <ParticipantItem
                            key={participant.id}
                            participant={participant}
                            currentUserId={currentUserId}
                            canManageRoles={canManageRoles}
                            onPromoteToModerator={handlePromoteToModerator}
                            onPromoteToHost={handlePromoteToHost}
                            onDemoteToViewer={handleDemoteToViewer}
                          />
                        ))}
                      </div>
                    )}

                    {/* Section: Viewers */}
                    {participants.some(p => p.role === "participant") && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                          Viewers
                        </h3>
                        {participants.filter(p => p.role === "participant").map((participant) => (
                          <ParticipantItem
                            key={participant.id}
                            participant={participant}
                            currentUserId={currentUserId}
                            canManageRoles={canManageRoles}
                            onPromoteToModerator={handlePromoteToModerator}
                            onPromoteToHost={handlePromoteToHost}
                            onDemoteToViewer={handleDemoteToViewer}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Change Video Dialog */}
      <Dialog open={showChangeVideo} onOpenChange={setShowChangeVideo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Change Video
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube URL or video ID to change the video for everyone in the room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="https://youtube.com/watch?v=... or video ID"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  setUrlError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleChangeVideo()}
                className="bg-input"
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Supported formats:
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>youtube.com/watch?v=VIDEO_ID</li>
                <li>youtu.be/VIDEO_ID</li>
                <li>Just the video ID</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeVideo(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeVideo} className="gap-2">
              <Play className="w-4 h-4" />
              Play Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ParticipantItem({
  participant,
  currentUserId,
  canManageRoles,
  onPromoteToModerator,
  onPromoteToHost,
  onDemoteToViewer,
}: {
  participant: Participant
  currentUserId: string
  canManageRoles: boolean
  onPromoteToModerator: (id: string) => void
  onPromoteToHost: (id: string) => void
  onDemoteToViewer: (id: string) => void
}) {
  const isCurrentUser = participant.id === currentUserId
  const showActions = canManageRoles && !isCurrentUser

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
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
          <span className="font-medium text-sm truncate">
            {participant.name}
            {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {participant.online ? "Online" : "Offline"}
          </span>
          {participant.role !== "participant" && (
            <span className="text-xs text-muted-foreground">
              {participant.role === "host" ? "Can manage roles" : "Can change video"}
            </span>
          )}
        </div>
      </div>
      
      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {participant.role === "participant" && (
              <DropdownMenuItem onClick={() => onPromoteToModerator(participant.id)}>
                <ShieldPlus className="w-4 h-4 mr-2 text-accent" />
                Make Moderator
              </DropdownMenuItem>
            )}
            {participant.role !== "host" && (
              <DropdownMenuItem onClick={() => onPromoteToHost(participant.id)}>
                <Crown className="w-4 h-4 mr-2 text-primary" />
                Transfer Host
              </DropdownMenuItem>
            )}
            {participant.role === "moderator" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDemoteToViewer(participant.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Moderator
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
