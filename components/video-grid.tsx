"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Expand,
  Shrink,
  Grid3x3,
  Focus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type LayoutMode = "grid" | "focus" | "pip" | "sidebar"

interface VideoStreamProps {
  stream: MediaStream | null
  muted?: boolean
  label: string
  peerId: string
  onRemove?: () => void
  isLocal?: boolean
  index?: number
  totalCount?: number
  layout?: LayoutMode
  onLayoutChange?: (layout: LayoutMode) => void
}

function DraggableVideoStream({
  stream,
  muted = false,
  label,
  peerId,
  onRemove,
  isLocal = false,
  layout = "grid",
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(muted)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const getLayoutClasses = () => {
    switch (layout) {
      case "focus":
        return "absolute inset-0 w-full h-full"
      case "sidebar":
        return "w-full h-36 rounded-xl"
      case "pip":
        return "w-56 h-40"
      default:
        return "w-full h-full"
    }
  }

  const baseClasses = `
    relative rounded-lg overflow-hidden bg-black/80 border border-white/10 
    shadow-lg group transition-all duration-200 hover:border-white/20
    ${getLayoutClasses()}
  `

  if (isMinimized && layout === "pip") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        drag
        dragElastic={0.2}
        dragMomentum={false}
        className={`${baseClasses} cursor-grab active:cursor-grabbing`}
        ref={containerRef}
      >
        <div className="w-full h-full flex items-center justify-center bg-black/90">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-lg bg-primary/80 hover:bg-primary text-white transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      drag={layout === "pip"}
      dragElastic={0.2}
      dragMomentum={false}
      className={`${baseClasses} ${layout === "pip" ? "cursor-grab active:cursor-grabbing" : ""}`}
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted || muted}
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

      {/* Label + Status */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white shadow-sm truncate flex-1">
            {label}
            {isLocal && <span className="text-[10px] text-primary-foreground ml-1">(You)</span>}
          </span>
          {!isLocal && (
            <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse shrink-0" />
          )}
        </div>
      </div>

      {/* Top Controls (always visible for focus/grid) */}
      <AnimatePresence>
        {(showControls || layout !== "pip") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 flex items-center gap-1 z-20"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border border-white/10"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {layout === "pip" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(true)}
                      className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border border-white/10"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Minimize</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {!isLocal && onRemove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRemove}
                      className="h-8 w-8 bg-destructive/50 hover:bg-destructive/70 text-white border border-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover indicator for draggable videos */}
      {layout === "pip" && (
        <div className="absolute top-1 left-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
      )}
    </motion.div>
  )
}

export function VideoGrid({
  localStream,
  remoteStreams,
  participants,
  onStreamClose,
}: {
  localStream: MediaStream | null
  remoteStreams: Record<string, MediaStream>
  participants: any[]
  onStreamClose?: (peerId: string) => void
}) {
  const [layout, setLayout] = useState<LayoutMode>("sidebar")
  const [focusedPeerId, setFocusedPeerId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const videoCount = Object.keys(remoteStreams).length + (localStream ? 1 : 0)
  const remoteVideoCount = Object.keys(remoteStreams).length

  // Auto-adjust layout based on video count
  useEffect(() => {
    if (videoCount === 0) {
      setLayout("sidebar")
    } else if (videoCount === 1 && !localStream) {
      setLayout("focus")
      setFocusedPeerId(Object.keys(remoteStreams)[0])
    }
  }, [videoCount, localStream, remoteStreams])

  // Handle layout-specific rendering
  const renderVideos = () => {
    const videos = []

    if (layout === "sidebar") {
      // Sidebar layout: participant videos on left/right, optimized for main content
      const allVideos = [
        localStream && { id: "local", stream: localStream, label: "You", isLocal: true },
        ...Object.entries(remoteStreams).map(([peerId, stream]) => {
          const participant = participants.find(p => p.user_id === peerId)
          return {
            id: peerId,
            stream,
            label: participant?.profiles?.username || "Someone",
            isLocal: false,
          }
        }),
      ].filter(Boolean)

      // Split videos: your video on left, others on right
      const yourVideo = allVideos.filter((v: any) => v.isLocal)
      const otherVideos = allVideos.filter((v: any) => !v.isLocal)

      return (
        <div className="absolute inset-0 flex items-start justify-between h-full gap-2 p-2 pointer-events-none">
          {/* Left Sidebar - Your video */}
          {yourVideo.length > 0 && (
            <motion.div
              className="flex flex-col gap-2 w-48 shrink-0 pointer-events-auto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {yourVideo.map((video: any) => (
                <DraggableVideoStream
                  key={video.id}
                  stream={video.stream}
                  muted={video.isLocal}
                  label={video.label}
                  peerId={video.id}
                  isLocal={video.isLocal}
                  layout="sidebar"
                />
              ))}
            </motion.div>
          )}

          {/* Center Content - Reserved for YouTube video (pointer-events-none so YouTube player works) */}
          <div className="flex-1" />

          {/* Right Sidebar - Other participants */}
          {otherVideos.length > 0 && (
            <motion.div
              className="flex flex-col gap-2 w-48 shrink-0 pointer-events-auto max-h-full overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {otherVideos.map((video: any) => (
                <DraggableVideoStream
                  key={video.id}
                  stream={video.stream}
                  label={video.label}
                  peerId={video.id}
                  onRemove={onStreamClose ? () => onStreamClose(video.id) : undefined}
                  layout="sidebar"
                />
              ))}
            </motion.div>
          )}
        </div>
      )
    } else if (layout === "focus" && focusedPeerId) {
      // Focus layout: one large video with small thumbnails at bottom
      const focusedStream = remoteStreams[focusedPeerId]
      const focusedParticipant = participants.find(p => p.user_id === focusedPeerId)

      if (focusedStream) {
        videos.push(
          <motion.div
            key={`focus-${focusedPeerId}`}
            layoutId={`video-${focusedPeerId}`}
            className="absolute inset-0"
          >
            <DraggableVideoStream
              stream={focusedStream}
              label={focusedParticipant?.profiles?.username || "Someone"}
              peerId={focusedPeerId}
              layout="focus"
            />
          </motion.div>
        )
      }

      // Small thumbnails at bottom
      const thumbnailVideos = [
        localStream && (
          <DraggableVideoStream
            key="local-thumb"
            stream={localStream}
            muted={true}
            label="You"
            peerId="local"
            isLocal={true}
            layout="pip"
          />
        ),
        ...Object.entries(remoteStreams)
          .filter(([id]) => id !== focusedPeerId)
          .map(([peerId, stream]) => {
            const participant = participants.find(p => p.user_id === peerId)
            return (
              <motion.div
                key={`thumb-${peerId}`}
                className="cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => setFocusedPeerId(peerId)}
              >
                <DraggableVideoStream
                  stream={stream}
                  label={participant?.profiles?.username || "Someone"}
                  peerId={peerId}
                  layout="pip"
                />
              </motion.div>
            )
          }),
      ].filter(Boolean)

      return (
        <>
          {videos}
          <motion.div
            className="absolute bottom-4 left-4 right-4 flex items-end gap-3 overflow-x-auto pb-2 pointer-events-auto z-10 custom-scrollbar"
            layout
          >
            {thumbnailVideos}
          </motion.div>
        </>
      )
    } else if (layout === "pip") {
      // PIP layout: all videos draggable and positioned freely
      return (
        <>
          {localStream && (
            <DraggableVideoStream
              stream={localStream}
              muted={true}
              label="You"
              peerId="local"
              isLocal={true}
              layout="pip"
            />
          )}
          {Object.entries(remoteStreams).map(([peerId, stream]) => {
            const participant = participants.find(p => p.user_id === peerId)
            return (
              <DraggableVideoStream
                key={peerId}
                stream={stream}
                label={participant?.profiles?.username || "Someone"}
                peerId={peerId}
                onRemove={onStreamClose ? () => onStreamClose(peerId) : undefined}
                layout="pip"
              />
            )
          })}
        </>
      )
    } else {
      // Grid layout: responsive grid
      const allVideos = [
        localStream && { id: "local", stream: localStream, label: "You", isLocal: true },
        ...Object.entries(remoteStreams).map(([peerId, stream]) => {
          const participant = participants.find(p => p.user_id === peerId)
          return {
            id: peerId,
            stream,
            label: participant?.profiles?.username || "Someone",
            isLocal: false,
          }
        }),
      ].filter(Boolean)

      return (
        <div
          className="grid gap-2 h-full p-2 auto-rows-max"
          // @ts-expect-error - Dynamic grid columns based on video count
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${getGridItemSize(allVideos.length)}px, 1fr))`,
          }}
        >
          {allVideos.map((video: any) => (
            <DraggableVideoStream
              key={video.id}
              stream={video.stream}
              muted={video.isLocal}
              label={video.label}
              peerId={video.id}
              isLocal={video.isLocal}
              onRemove={
                !video.isLocal && onStreamClose
                  ? () => onStreamClose(video.id)
                  : undefined
              }
              layout="grid"
            />
          ))}
        </div>
      )
    }
  }

  if (videoCount === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full z-10 pointer-events-auto flex flex-col"
    >
      {/* Layout Controls - Top */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 absolute top-0 left-0 z-20"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout === "sidebar" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout("sidebar")}
                className="gap-1.5 h-8 text-xs"
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sidebar View (Best for watch parties)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout("grid")}
                className="gap-1.5 h-8 text-xs"
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout === "focus" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setLayout("focus")
                  if (!focusedPeerId && remoteVideoCount > 0) {
                    setFocusedPeerId(Object.keys(remoteStreams)[0])
                  }
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Focus className="w-4 h-4" />
                <span className="hidden sm:inline">Focus</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Focus View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout === "pip" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout("pip")}
                className="gap-1.5 h-8 text-xs"
              >
                <Expand className="w-4 h-4" />
                <span className="hidden sm:inline">PIP</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Picture in Picture (Draggable)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Video Container */}
      <motion.div
        className={`flex-1 relative overflow-hidden
          ${
            layout === "focus"
              ? ""
              : layout === "pip"
              ? "flex flex-wrap gap-3"
              : ""
          }
        `}
        layout
      >
        <AnimatePresence mode="wait">{renderVideos()}</AnimatePresence>
      </motion.div>
    </div>
  )
}

function getGridItemSize(count: number): number {
  if (count <= 1) return 300
  if (count <= 4) return 200
  if (count <= 9) return 150
  return 120
}
