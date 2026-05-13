"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Play, 
  Users, 
  ArrowLeft, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRoom, joinRoom } from "@/lib/actions/rooms"
import { setGuestSession } from "@/lib/actions/auth"

type Mode = "select" | "create" | "join"

export function RoomsPage() {
  const [mode, setMode] = useState<Mode>("select")
  const [username, setUsername] = useState("")
  const [roomTitle, setRoomTitle] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateRoom = async () => {
    if (!username.trim() || !roomTitle.trim()) return
    setIsCreating(true)
    
    // Set custom guest session cookie
    const session = await setGuestSession(username)
    if (!session) {
      alert("Failed to initialize session")
      setIsCreating(false)
      return
    }

    const result = await createRoom(roomTitle)
    if (result.error) {
      alert("Error creating room: " + result.error)
      setIsCreating(false)
      return
    }
    
    if (result.room) {
      setGeneratedCode(result.room.code)
    }
    setIsCreating(false)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) return
    
    // Set custom guest session cookie
    const session = await setGuestSession(username)
    if (!session) {
      alert("Failed to initialize session")
      return
    }

    const result = await joinRoom(roomCode)
    if (result.error) {
      alert(result.error)
      return
    }

    window.location.href = `/watch/${roomCode.toUpperCase()}`
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <AnimatePresence mode="wait">
          {mode === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Play className="w-10 h-10 text-primary fill-primary" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Ready to <span className="text-gradient">watch?</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Create a new room or join an existing one
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  onClick={() => setMode("create")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-8 rounded-3xl glass hover:bg-card/80 transition-all text-left group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Create Room</h2>
                  <p className="text-muted-foreground">
                    Start a new watch party and invite your friends
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-primary">
                    <span className="font-medium">Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setMode("join")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-8 rounded-3xl glass hover:bg-card/80 transition-all text-left group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Join Room</h2>
                  <p className="text-muted-foreground">
                    Enter a room code to join an existing party
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-accent">
                    <span className="font-medium">Enter code</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === "create" && !generatedCode && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md"
            >
              <button
                onClick={() => setMode("select")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="p-8 rounded-3xl glass">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                
                <h1 className="text-3xl font-bold mb-2">Create Room</h1>
                <p className="text-muted-foreground mb-8">
                  Set up your watch party
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-foreground">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-11 h-12 bg-input border-border/50 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomTitle" className="text-foreground">Room Name</Label>
                    <Input
                      id="roomTitle"
                      placeholder="Friday Movie Night"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      className="h-12 bg-input border-border/50 focus:border-primary"
                    />
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    disabled={!username.trim() || !roomTitle.trim() || isCreating}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                  >
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "create" && generatedCode && (
            <motion.div
              key="created"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center"
            >
              <div className="p-8 rounded-3xl glass">
                <div className="w-20 h-20 rounded-full bg-chart-3/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-chart-3" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Room Created!</h1>
                <p className="text-muted-foreground mb-8">
                  Share this code with your friends
                </p>

                <div className="relative mb-6">
                  <div className="text-5xl font-mono font-bold tracking-[0.3em] text-foreground py-6 px-4 rounded-2xl bg-card border border-border/50">
                    {generatedCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-chart-3" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <Link href={`/watch/${generatedCode}`}>
                  <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-primary">
                    <Play className="w-5 h-5 fill-current" />
                    Enter Room
                  </Button>
                </Link>

                <button
                  onClick={() => {
                    setGeneratedCode("")
                    setMode("select")
                  }}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create another room
                </button>
              </div>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md"
            >
              <button
                onClick={() => setMode("select")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="p-8 rounded-3xl glass">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-accent" />
                </div>
                
                <h1 className="text-3xl font-bold mb-2">Join Room</h1>
                <p className="text-muted-foreground mb-8">
                  Enter the 6-digit room code
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="join-username" className="text-foreground">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="join-username"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-11 h-12 bg-input border-border/50 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomCode" className="text-foreground">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="ABC123"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                      className="h-12 bg-input border-border/50 focus:border-primary text-center text-2xl font-mono tracking-[0.2em] uppercase"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    onClick={handleJoinRoom}
                    disabled={!username.trim() || roomCode.length !== 6}
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
                  >
                    Join Room
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
