"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface WebRTCStats {
  bytesReceived: number
  bytesSent: number
  packetsLost: number
  jitter: number
  videoResolution?: { width: number; height: number }
}

export interface PeerStatus {
  [key: string]: {
    connectionState: RTCPeerConnectionState
    iceConnectionState: RTCIceConnectionState
    stats?: WebRTCStats
  }
}

export function useWebRTC(roomId: string, userId: string | undefined) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [peerStats, setPeerStats] = useState<PeerStatus>({})
  
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const channelRef = useRef<any>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  // Initialize signaling channel
  useEffect(() => {
    if (!roomId || !userId) return

    const channel = supabase.channel(`webrtc:${roomId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        // Ignore our own signals
        if (payload.from === userId) return
        
        // If the signal is specifically for us, or a general broadcast
        if (payload.target && payload.target !== userId) return

        const { type, from, data } = payload

        if (type === 'join') {
          // A new user joined, let's create a peer connection and offer if we have media
          if (localStream) {
            createPeer(from, true)
          }
        } else if (type === 'offer') {
          await handleOffer(from, data)
        } else if (type === 'answer') {
          await handleAnswer(from, data)
        } else if (type === 'ice-candidate') {
          await handleIceCandidate(from, data)
        } else if (type === 'leave') {
          removePeer(from)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce we joined
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'join', from: userId }
          })
        }
      })

    return () => {
      // Cleanup
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'leave', from: userId }
      })
      supabase.removeChannel(channel)
      Object.values(peersRef.current).forEach(pc => pc.close())
      peersRef.current = {}
    }
  }, [roomId, userId, localStream])

  const createPeer = (targetUserId: string, initiator: boolean): RTCPeerConnection => {
    if (peersRef.current[targetUserId]) return peersRef.current[targetUserId]

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ],
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require"
    })

    peersRef.current[targetUserId] = pc

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'ice-candidate', from: userId, target: targetUserId, data: event.candidate }
        })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetUserId]: event.streams[0]
      }))
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${targetUserId}: ${pc.iceConnectionState}`)
      
      if (pc.iceConnectionState === 'disconnected') {
        // Try to reconnect
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            removePeer(targetUserId)
          }
        }, 5000)
      } else if (pc.iceConnectionState === 'failed' || pc.connectionState === 'failed') {
        removePeer(targetUserId)
      }
    }

    if (initiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer)
      }).then(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'offer', from: userId, target: targetUserId, data: pc.localDescription }
          })
        }
      })
    }

    return pc
  }

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPeer(fromUserId, false)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', from: userId, target: fromUserId, data: pc.localDescription }
      })
    }
  }

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current[fromUserId]
    if (pc && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current[fromUserId]
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) {
        console.error("Error adding ice candidate", e)
      }
    }
  }

  const removePeer = (targetUserId: string) => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close()
      delete peersRef.current[targetUserId]
    }
    setRemoteStreams(prev => {
      const newStreams = { ...prev }
      delete newStreams[targetUserId]
      return newStreams
    })
  }

  const toggleMedia = async (type: 'audio' | 'video') => {
    try {
      if (type === 'audio' && isAudioEnabled) {
        // Turn off audio
        localStream?.getAudioTracks().forEach(t => { t.stop(); localStream.removeTrack(t) })
        setIsAudioEnabled(false)
      } else if (type === 'video' && isVideoEnabled) {
        // Turn off video
        localStream?.getVideoTracks().forEach(t => { t.stop(); localStream.removeTrack(t) })
        setIsVideoEnabled(false)
      } else {
        // Turn on media
        const constraints = {
          audio: type === 'audio' ? true : isAudioEnabled,
          video: type === 'video' ? true : isVideoEnabled
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        // Update local stream
        if (!localStream) {
          setLocalStream(stream)
        } else {
          stream.getTracks().forEach(track => {
            localStream.addTrack(track)
          })
        }
        
        // Update state
        if (type === 'audio') setIsAudioEnabled(true)
        if (type === 'video') setIsVideoEnabled(true)

        // Renegotiate with all peers
        Object.keys(peersRef.current).forEach(peerId => {
          removePeer(peerId) // Easiest way to renegotiate is to recreate the peer connection
          createPeer(peerId, true)
        })
        
        // Announce we updated our media
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'join', from: userId }
          })
        }
      }
    } catch (err) {
      console.error("Error accessing media devices.", err)
      alert("Could not access camera/microphone. Please check permissions.")
    }
  }

  // Effect to clean up stream on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [localStream])

  // Collect stats from peer connections
  const collectStats = useCallback(async () => {
    const stats: PeerStatus = {}
    
    for (const [peerId, pc] of Object.entries(peersRef.current)) {
      stats[peerId] = {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
      }

      try {
        const reports = await pc.getStats()
        let bytesReceived = 0
        let bytesSent = 0
        let packetsLost = 0
        let jitter = 0
        let videoResolution: { width: number; height: number } | undefined

        reports.forEach(report => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            bytesReceived = report.bytesReceived || 0
            packetsLost = report.packetsLost || 0
            jitter = report.jitter || 0
            if (report.frameWidth && report.frameHeight) {
              videoResolution = {
                width: report.frameWidth,
                height: report.frameHeight,
              }
            }
          }
          if (report.type === "outbound-rtp" && report.kind === "video") {
            bytesSent = report.bytesSent || 0
          }
        })

        stats[peerId].stats = {
          bytesReceived,
          bytesSent,
          packetsLost,
          jitter,
          videoResolution,
        }
      } catch (e) {
        console.warn("Error collecting stats", e)
      }
    }

    setPeerStats(stats)
  }, [])

  // Start periodic stats collection
  useEffect(() => {
    if (Object.keys(peersRef.current).length > 0) {
      if (!statsIntervalRef.current) {
        statsIntervalRef.current = setInterval(collectStats, 1000)
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
        statsIntervalRef.current = undefined
      }
    }
  }, [collectStats])

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    peerStats,
    toggleAudio: () => toggleMedia('audio'),
    toggleVideo: () => toggleMedia('video')
  }
}
