"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getGuestSession } from "@/lib/actions/auth"
import type { Room, RoomParticipant, Message, Profile, Role } from "@/lib/types"

interface ParticipantWithProfile extends RoomParticipant {
  profiles: Profile
}

interface MessageWithProfile extends Message {
  profiles: Profile
}

export function useRoom(roomCode: string) {
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([])
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; role: Role } | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const emitPlaybackSync = useCallback((isPlaying: boolean, playbackTime: number) => {
    if (!room) return
    supabase.channel(`room:${room.id}`).send({
      type: 'broadcast',
      event: 'playback_sync',
      payload: { is_playing: isPlaying, playback_time: playbackTime }
    })
  }, [room, supabase])

  const fetchRoom = useCallback(async () => {
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

    if (roomError) {
      setError("Room not found")
      setLoading(false)
      return
    }

    setRoom(roomData)
    return roomData
  }, [roomCode, supabase])

  const fetchParticipants = useCallback(async (roomId: string) => {
    const { data: participantsData } = await supabase
      .from("room_participants")
      .select("*, profiles(*)")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true })

    if (participantsData) {
      setParticipants(participantsData as ParticipantWithProfile[])
    }

    return participantsData
  }, [supabase])

  const fetchMessages = useCallback(async (roomId: string) => {
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*, profiles(*)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100)

    if (messagesData) {
      setMessages(messagesData as MessageWithProfile[])
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true
    let roomChannel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      // Get current user via custom guest session
      const userId = await getGuestSession()
      if (!userId) {
        setError("Not authenticated. Return to the main page to set a nickname.")
        setLoading(false)
        return
      }

      // Fetch room
      const roomData = await fetchRoom()
      if (!roomData || !mounted) return

      // Fetch participants
      const participantsData = await fetchParticipants(roomData.id)
      
      // Find current user's role
      const currentParticipant = participantsData?.find(p => p.user_id === userId)
      if (currentParticipant) {
        setCurrentUser({ id: userId, role: currentParticipant.role as Role })
      }

      // Fetch messages
      await fetchMessages(roomData.id)

      if (!mounted) return

      setLoading(false)

      // Set up realtime subscriptions - build channel first before adding listeners
      const channelName = `room:${roomData.id}`
      
      roomChannel = supabase.channel(channelName, {
        config: {
          presence: { key: userId },
        },
      })

      // Add all listeners BEFORE subscribe
      roomChannel
        .on('presence', { event: 'sync' }, () => {
          if (roomChannel && mounted) {
            const newState = roomChannel.presenceState()
            setOnlineUsers(Object.keys(newState))
          }
        })
        .on('broadcast', { event: 'playback_sync' }, (payload) => {
          if (mounted) {
            setRoom(prev => prev ? { ...prev, ...payload.payload } : prev)
          }
        })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomData.id}` },
          (payload) => {
            if (mounted) {
              if (payload.eventType === "UPDATE") {
                setRoom(payload.new as Room)
              } else if (payload.eventType === "DELETE") {
                setError("Room has been deleted")
              }
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomData.id}` },
          async () => {
            if (mounted) {
              await fetchParticipants(roomData.id)
              // Re-check current user's role
              const { data: updatedParticipant } = await supabase
                .from("room_participants")
                .select("role")
                .eq("room_id", roomData.id)
                .eq("user_id", userId)
                .single()
              
              if (updatedParticipant && mounted) {
                setCurrentUser({ id: userId, role: updatedParticipant.role as Role })
              }
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomData.id}` },
          async (payload) => {
            if (!mounted) return

            // Check if we already have this message optimistically
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id || (m.content === payload.new.content && m.user_id === payload.new.user_id && new Date(payload.new.created_at).getTime() - new Date(m.created_at).getTime() < 2000))) {
                return prev;
              }
              return prev;
            });

            // Fetch the new message with profile
            const { data: newMessage } = await supabase
              .from("messages")
              .select("*, profiles(*)")
              .eq("id", payload.new.id)
              .single()

            if (newMessage && mounted) {
              setMessages(prev => {
                // Remove the optimistic message if it exists (match by content, user_id, and close timestamp)
                const filtered = prev.filter(m => !(m.content === newMessage.content && m.user_id === newMessage.user_id && Math.abs(new Date(newMessage.created_at).getTime() - new Date(m.created_at).getTime()) < 5000));
                return [...filtered, newMessage as MessageWithProfile]
              })
            }
          }
        )

      // Now subscribe AFTER all listeners are added
      roomChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && mounted && roomChannel) {
          await roomChannel.track({ online_at: new Date().toISOString() })
        }
      })
    }

    init()

    return () => {
      mounted = false
      if (roomChannel) {
        roomChannel.unsubscribe()
        supabase.removeChannel(roomChannel)
        roomChannel = null
      }
    }
  }, [roomCode, supabase, fetchRoom, fetchParticipants, fetchMessages])

  const addOptimisticMessage = useCallback((content: string) => {
    if (!room || !currentUser) return
    
    const currentUserProfile = participants.find(p => p.user_id === currentUser.id)?.profiles
    
    const optimisticMsg: MessageWithProfile = {
      id: crypto.randomUUID(),
      room_id: room.id,
      user_id: currentUser.id,
      content,
      message_type: 'user',
      created_at: new Date().toISOString(),
      profiles: currentUserProfile || {
        id: currentUser.id,
        username: "You",
        avatar_url: null,
        created_at: new Date().toISOString()
      }
    }
    
    setMessages(prev => [...prev, optimisticMsg])
  }, [room, currentUser, participants])

  return {
    room,
    participants,
    messages,
    currentUser,
    onlineUsers,
    emitPlaybackSync,
    addOptimisticMessage,
    loading,
    error,
    refetchParticipants: () => room && fetchParticipants(room.id),
  }
}
