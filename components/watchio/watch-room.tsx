"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube"
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
  LogOut,
  Loader2,
  ChevronDown,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Smile,
  Play
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MediaSettingsDialog } from "@/components/media-settings-dialog"
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useRoom } from "@/hooks/use-room"
import { useWebRTC } from "@/hooks/use-webrtc"
import { sendMessage, updateVideo, updateParticipantRole, leaveRoom } from "@/lib/actions/rooms"
import { VideoGrid } from "@/components/video-grid"
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
      Participant
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
  const { room, participants, messages, currentUser, onlineUsers, emitPlaybackSync, addOptimisticMessage, loading, error } = useRoom(roomCode)
  
  const [videoUrl, setVideoUrl] = useState("")
  const [showChangeVideo, setShowChangeVideo] = useState(false)
  const [urlError, setUrlError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [showMediaSettings, setShowMediaSettings] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const { localStream, remoteStreams, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo } = useWebRTC(room?.id || "", currentUser?.id)

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

  const playerRef = useRef<YouTubePlayer | null>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player || !room) return

    const playerState = player.getPlayerState?.()
    if (room.is_playing && playerState !== 1) {
      player.playVideo()
    } else if (!room.is_playing && playerState === 1) {
      player.pauseVideo()
    }

    const currentTime = player.getCurrentTime?.() || 0
    if (Math.abs(currentTime - room.playback_time) > 2) {
      player.seekTo(room.playback_time, true)
    }
  }, [room?.is_playing, room?.playback_time])

  const handleStateChange = (event: YouTubeEvent) => {
    if (!canChangeVideo || !room) return

    const isPlaying = event.data === 1
    const isPaused = event.data === 2
    
    if (isPlaying || isPaused) {
      const currentTime = event.target.getCurrentTime()
      emitPlaybackSync(isPlaying, currentTime)
      
      if (isPlaying !== room.is_playing) {
        import("@/lib/actions/rooms").then(m => m.syncPlayback(room.id, isPlaying, currentTime))
      }
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !room || sending) return
    const content = messageInput.trim()
    setMessageInput("")
    addOptimisticMessage(content)
    
    // Fire and forget
    sendMessage(room.id, content).catch(console.error)
  }

  const onEmojiClick = (emojiData: any) => {
    setMessageInput((prev) => prev + emojiData.emoji)
    setEmojiOpen(false)
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
            <VideoIcon className="w-8 h-8 text-destructive" />
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

  const onlineCount = onlineUsers.length || participants.length

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border/50 glass shrink-0 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button 
            onClick={() => setShowLeaveDialog(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors shrink-0"
            title="Leave room"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">{room.name}</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-mono text-xs">{roomCode}</span>
              <button onClick={handleCopyCode} className="p-1 hover:text-foreground transition-colors">
                {copied ? <Check className="w-3 h-3 text-chart-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canChangeVideo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangeVideo(true)}
              className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10 px-2 sm:px-3"
            >
              <VideoIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Change Video</span>
            </Button>
          )}
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
            <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse" />
            <span>{onlineCount}</span>
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
            <Users className="w-4 h-4 md:w-5 md:h-5" />
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
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          {/* WebRTC Controls */}
          <div className="flex items-center gap-0.5 border-l border-border/50 pl-1 ml-1">
            <Button
              variant={isAudioEnabled ? "default" : "ghost"}
              size="icon"
              onClick={toggleAudio}
              className={`h-8 w-8 md:h-9 md:w-9 ${isAudioEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "default" : "ghost"}
              size="icon"
              onClick={toggleVideo}
              className={`h-8 w-8 md:h-9 md:w-9 ${isVideoEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {isVideoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMediaSettings(true)}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                <ChevronDown className="w-4 h-4" />
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 flex flex-col bg-black min-h-0 relative">
          <div className="flex-1 relative">
            {room.current_video_id ? (
              <div className="absolute inset-0 w-full h-full">
                <YouTube
                  videoId={room.current_video_id}
                  opts={{
                    height: '100%',
                    width: '100%',
                    playerVars: {
                      autoplay: 1,
                      rel: 0,
                      modestbranding: 1,
                      controls: canChangeVideo ? 1 : 0,
                      disablekb: canChangeVideo ? 0 : 1,
                    },
                  }}
                  onReady={(e) => { playerRef.current = e.target }}
                  onStateChange={handleStateChange}
                  className="w-full h-full"
                  iframeClassName="w-full h-full border-0 pointer-events-auto"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <VideoIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">No Video Playing</h2>
                  <p className="text-muted-foreground mb-4">
                    {canChangeVideo 
                      ? "Click \"Change Video\" to start watching together" 
                      : "Waiting for the host to start a video"}
                  </p>
                  {canChangeVideo && (
                    <Button onClick={() => setShowChangeVideo(true)}>
                      <VideoIcon className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* WebRTC Video Grid Overlay */}
            {(localStream || Object.keys(remoteStreams).length > 0) && (
              <div className="absolute inset-0">
                <VideoGrid
                  localStream={localStream}
                  remoteStreams={remoteStreams}
                  participants={participants}
                />
              </div>
            )}
          </div>

          {/* Role indicator bar */}
          <div className="px-3 py-1.5 bg-card/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <RoleIcon role={currentUser?.role || "participant"} />
              <span className="text-xs text-muted-foreground truncate">
                {currentUser?.role === "host" ? "Host" : currentUser?.role === "moderator" ? "Moderator" : "Participant"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
              {canChangeVideo ? (
                <span className="flex items-center gap-1 text-chart-3">
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">Can change video</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  <span className="hidden sm:inline">Watch only</span>
                </span>
              )}
              {canManageRoles && (
                <span className="flex items-center gap-1 text-primary">
                  <Crown className="w-3 h-3" />
                  <span className="hidden sm:inline">Manage roles</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — desktop: right panel | mobile: bottom sheet */}
        <AnimatePresence>
          {(showChat || showParticipants) && (
            <motion.aside
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-border/50 flex flex-col glass overflow-hidden shrink-0"
              style={{ maxHeight: "45dvh" }}
            >
              {/* mobile inner — scroll contained */}
              <div className="flex flex-col h-full overflow-hidden">
              {/* Tabs (shared between mobile & desktop, rendered once) */}
              <div className="flex border-b border-border/50 shrink-0">
                <button
                  onClick={() => { setShowChat(true); setShowParticipants(false) }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                    showChat && !showParticipants
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => { setShowParticipants(true); setShowChat(false) }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
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
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-sm"
                                // @ts-expect-error - Dynamic inline style for avatar color
                                style={{ background: getAvatarColor(msg.user_id) }}
                              >
                                {msg.profiles?.username?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0 bg-secondary/20 p-2.5 rounded-2xl rounded-tl-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  {(() => {
                                    const participant = participants.find(p => p.user_id === msg.user_id)
                                    const isHost = participant?.role === "host"
                                    const isMod = participant?.role === "moderator"
                                    
                                    return (
                                      <>
                                        <span className={`font-bold text-sm ${isHost ? 'text-primary' : isMod ? 'text-accent' : 'text-foreground'}`}>
                                          {msg.profiles?.username || "Unknown"}
                                        </span>
                                        {participant && <RoleBadge role={participant.role} />}
                                      </>
                                    )
                                  })()}
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-[15px] leading-snug text-foreground/90 break-words">{msg.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Chat Input (mobile) */}
                  <div className="shrink-0 border-t border-border/50">
                    {/* Inline emoji picker – no floating popover that clips in a bottom sheet */}
                    {emojiOpen && (
                      <div className="w-full overflow-hidden border-b border-border/30">
                        <EmojiPicker
                          theme={Theme.AUTO}
                          onEmojiClick={onEmojiClick}
                          lazyLoadEmojis={true}
                          width="100%"
                          height={280}
                        />
                      </div>
                    )}
                    <div className="p-3 flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Send a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                          className="pr-10 bg-input border-border/50 focus:border-primary rounded-full"
                        />
                        <button
                          onClick={() => setEmojiOpen(!emojiOpen)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          title="Open emoji picker"
                        >
                          <Smile className={`w-4 h-4 ${emojiOpen ? 'text-primary' : ''}`} />
                        </button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!messageInput.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shrink-0"
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
                          currentUserId={currentUser?.id}
                          isOnline={onlineUsers.includes(participant.user_id)}
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
                            isOnline={onlineUsers.includes(participant.user_id)}
                            canManageRoles={canManageRoles}
                            onRoleChange={handleRoleChange}
                          />
                        ))}
                      </div>
                    )}

                    {/* Section: Participants */}
                    {participants.some(p => p.role === "participant") && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                          Participants
                        </h3>
                        {participants.filter(p => p.role === "participant").map((participant) => (
                          <ParticipantItem
                            key={participant.id}
                            participant={participant}
                            currentUserId={currentUser?.id}
                            isOnline={onlineUsers.includes(participant.user_id)}
                            canManageRoles={canManageRoles}
                            onRoleChange={handleRoleChange}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>{/* end mobile inner */}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <AnimatePresence>
          {(showChat || showParticipants) && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden md:flex border-l border-border/50 flex-col glass overflow-hidden shrink-0"
            >
              {/* Tabs */}
              <div className="flex border-b border-border/50 shrink-0">
                <button
                  onClick={() => { setShowChat(true); setShowParticipants(false) }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    showChat && !showParticipants
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => { setShowParticipants(true); setShowChat(false) }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    showParticipants
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  People ({onlineCount})
                </button>
              </div>

              {/* Chat (desktop) */}
              {showChat && !showParticipants && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id}>
                          {msg.message_type === "system" ? (
                            <div className="text-center py-1">
                              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                                {msg.content}
                              </span>
                            </div>
                          ) : (
                            <div className="flex gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-sm"
                                // @ts-expect-error - Dynamic inline style for avatar color
                                style={{ background: getAvatarColor(msg.user_id) }}
                              >
                                {msg.profiles?.username?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0 bg-secondary/20 p-2 rounded-2xl rounded-tl-sm">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  {(() => {
                                    const participant = participants.find(p => p.user_id === msg.user_id)
                                    const isHost = participant?.role === "host"
                                    const isMod = participant?.role === "moderator"
                                    return (
                                      <>
                                        <span className={`font-bold text-sm ${isHost ? 'text-primary' : isMod ? 'text-accent' : 'text-foreground'}`}>
                                          {msg.profiles?.username || "Unknown"}
                                        </span>
                                        {participant && <RoleBadge role={participant.role} />}
                                      </>
                                    )
                                  })()}
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-sm leading-snug text-foreground/90 break-words">{msg.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-border/50 shrink-0">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Send a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                          className="pr-10 bg-input border-border/50 focus:border-primary rounded-full"
                        />
                        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                          <PopoverTrigger asChild>
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" title="Open emoji picker">
                              <Smile className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="end" sideOffset={10} className="p-0 border-none bg-transparent shadow-none">
                            <EmojiPicker theme={Theme.AUTO} onEmojiClick={onEmojiClick} lazyLoadEmojis={true} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!messageInput.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants (desktop) */}
              {showParticipants && (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-1">
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Host</h3>
                      {participants.filter(p => p.role === "host").map((participant) => (
                        <ParticipantItem key={participant.id} participant={participant} currentUserId={currentUser?.id} isOnline={onlineUsers.includes(participant.user_id)} canManageRoles={canManageRoles} onRoleChange={handleRoleChange} />
                      ))}
                    </div>
                    {participants.some(p => p.role === "moderator") && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Moderators</h3>
                        {participants.filter(p => p.role === "moderator").map((participant) => (
                          <ParticipantItem key={participant.id} participant={participant} currentUserId={currentUser?.id} isOnline={onlineUsers.includes(participant.user_id)} canManageRoles={canManageRoles} onRoleChange={handleRoleChange} />
                        ))}
                      </div>
                    )}
                    {participants.some(p => p.role === "participant") && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Participants</h3>
                        {participants.filter(p => p.role === "participant").map((participant) => (
                          <ParticipantItem key={participant.id} participant={participant} currentUserId={currentUser?.id} isOnline={onlineUsers.includes(participant.user_id)} canManageRoles={canManageRoles} onRoleChange={handleRoleChange} />
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

      {/* Media Settings Dialog */}
      <MediaSettingsDialog
        open={showMediaSettings}
        onOpenChange={setShowMediaSettings}
        currentSettings={{
          videoEnabled: isVideoEnabled,
          audioEnabled: isAudioEnabled,
          videoWidth: 1280,
          videoHeight: 720,
          frameRate: 30,
        }}
        onSave={(settings) => {
          // Settings will be applied on next media toggle
          console.log("Saved media settings:", settings)
        }}
      />
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
  isOnline: boolean
  canManageRoles: boolean
  onRoleChange: (userId: string, role: Role) => void
}

function ParticipantItem({ participant, currentUserId, isOnline, canManageRoles, onRoleChange }: ParticipantItemProps) {
  const isCurrentUser = participant.user_id === currentUserId
  const canManageThisUser = canManageRoles && !isCurrentUser && participant.role !== "host"

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
            // @ts-expect-error - Dynamic inline style for avatar color
            style={{ background: getAvatarColor(participant.user_id) }}
          >
            {participant.profiles?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isOnline ? 'bg-chart-2' : 'bg-muted'}`} />
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
            {participant.role === "participant" && (
              <DropdownMenuItem onClick={() => onRoleChange(participant.user_id, "moderator")}>
                <Shield className="w-4 h-4 mr-2 text-accent" />
                Make Moderator
              </DropdownMenuItem>
            )}
            {participant.role === "moderator" && (
              <DropdownMenuItem onClick={() => onRoleChange(participant.user_id, "participant")}>
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
