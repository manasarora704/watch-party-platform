"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Smile,
  Play,
  Video,
  LogOut,
  Loader2,
  ChevronDown
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
import { useRoom } from "@/hooks/use-room"
import { sendMessage, updateVideo, updateParticipantRole, leaveRoom } from "@/lib/actions/rooms"
import type { Role } from "@/lib/types"

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

function getAvatarColor(userId: string): string {
  const colors = [
    "oklch(0.75 0.18 195)",
    "oklch(0.65 0.25 330)",
    "oklch(0.7 0.2 145)",
    "oklch(0.8 0.15 85)",
    "oklch(0.6 0.2 280)",
    "oklch(0.7 0.22 30)",
    "oklch(0.65 0.2 220)",
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function WatchRoom({ roomCode }: { roomCode: string }) {
  const router = useRouter()
  const { room, participants, messages, currentUser, loading, error } = useRoom(roomCode)
  
  const [videoUrl, setVideoUrl] = useState("")
  const [showChangeVideo, setShowChangeVideo] = useState(false)
  const [urlError, setUrlError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !room || sending) return
    setSending(true)
    await sendMessage(room.id, messageInput.trim())
    setMessageInput("")
    setSending(false)
  }

  const handleChangeVideo = async () => {
    if (!canChangeVideo || !room) return
    
    const id = extractYouTubeId(videoUrl.trim())
    if (!id) {
      setUrlError("Please enter a valid YouTube URL or video ID")
      return
    }
    
    await updateVideo(room.id, id)
    setShowChangeVideo(false)
    setVideoUrl("")
    setUrlError("")
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!canManageRoles || !room) return
    await updateParticipantRole(room.id, userId, newRole)
  }

  const handleLeaveRoom = async () => {
    if (!room) return
    const result = await leaveRoom(room.id)
    if (result.success) {
      router.push("/rooms")
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading watch party...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Room Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "This room doesn't exist or has been deleted."}</p>
          <Link href="/rooms">
            <Button>Back to Rooms</Button>
          </Link>
        </div>
      </div>
    )
  }

  const onlineCount = participants.length

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 glass shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLeaveDialog(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground">{room.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{roomCode}</span>
              <button onClick={handleCopyCode} className="p-1 hover:text-foreground transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-chart-3" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Leave Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex-1 relative">
            {room.current_video_id ? (
              <iframe
                src={`https://www.youtube.com/embed/${room.current_video_id}?autoplay=1&rel=0&modestbranding=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">No Video Playing</h2>
                  <p className="text-muted-foreground mb-4">
                    {canChangeVideo 
                      ? "Click \"Change Video\" to start watching together" 
                      : "Waiting for the host to start a video"}
                  </p>
                  {canChangeVideo && (
                    <Button onClick={() => setShowChangeVideo(true)}>
                      <Video className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role indicator bar */}
          <div className="px-4 py-2 bg-card/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <RoleIcon role={currentUser?.role || "viewer"} />
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
                          {msg.message_type === "system" ? (
                            <div className="text-center py-2">
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                {msg.content}
                              </span>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 text-white"
                                style={{ background: getAvatarColor(msg.user_id) }}
                              >
                                {msg.profiles?.username?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{msg.profiles?.username || "Unknown"}</span>
                                  {(() => {
                                    const participant = participants.find(p => p.user_id === msg.user_id)
                                    return participant ? <RoleBadge role={participant.role} /> : null
                                  })()}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
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
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                          className="pr-10 bg-input border-border/50 focus:border-primary"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={sending || !messageInput.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                          currentUserId={currentUser?.id}
                          canManageRoles={canManageRoles}
                          onRoleChange={handleRoleChange}
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
                            currentUserId={currentUser?.id}
                            canManageRoles={canManageRoles}
                            onRoleChange={handleRoleChange}
                          />
                        ))}
                      </div>
                    )}

                    {/* Section: Viewers */}
                    {participants.some(p => p.role === "viewer") && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                          Viewers
                        </h3>
                        {participants.filter(p => p.role === "viewer").map((participant) => (
                          <ParticipantItem
                            key={participant.id}
                            participant={participant}
                            currentUserId={currentUser?.id}
                            canManageRoles={canManageRoles}
                            onRoleChange={handleRoleChange}
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
            <DialogTitle>Change Video</DialogTitle>
            <DialogDescription>
              Paste a YouTube link or video ID to start watching together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://youtube.com/watch?v=... or video ID"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value)
                setUrlError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleChangeVideo()}
            />
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeVideo(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeVideo}>
              Play Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Room Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Room?</DialogTitle>
            <DialogDescription>
              {currentUser?.role === "host" 
                ? "As the host, leaving will delete the room for everyone."
                : "Are you sure you want to leave this watch party?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ParticipantItemProps {
  participant: {
    id: string
    user_id: string
    role: Role
    profiles: {
      username: string | null
      avatar_url: string | null
    }
  }
  currentUserId?: string
  canManageRoles: boolean
  onRoleChange: (userId: string, role: Role) => void
}

function ParticipantItem({ participant, currentUserId, canManageRoles, onRoleChange }: ParticipantItemProps) {
  const isCurrentUser = participant.user_id === currentUserId
  const canManageThisUser = canManageRoles && !isCurrentUser && participant.role !== "host"

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{ background: getAvatarColor(participant.user_id) }}
          >
            {participant.profiles?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-chart-3 rounded-full border-2 border-background" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {participant.profiles?.username || "Unknown"}
              {isCurrentUser && " (You)"}
            </span>
          </div>
          <RoleBadge role={participant.role} />
        </div>
      </div>

      {canManageThisUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {participant.role === "viewer" && (
              <DropdownMenuItem onClick={() => onRoleChange(participant.user_id, "moderator")}>
                <Shield className="w-4 h-4 mr-2 text-accent" />
                Make Moderator
              </DropdownMenuItem>
            )}
            {participant.role === "moderator" && (
              <DropdownMenuItem onClick={() => onRoleChange(participant.user_id, "viewer")}>
                <User className="w-4 h-4 mr-2" />
                Remove Moderator
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRoleChange(participant.user_id, "host")}>
              <Crown className="w-4 h-4 mr-2 text-primary" />
              Transfer Host
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
