"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

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

    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      // Fetch room
      const roomData = await fetchRoom()
      if (!roomData || !mounted) return

      // Fetch participants
      const participantsData = await fetchParticipants(roomData.id)
      
      // Find current user's role
      const currentParticipant = participantsData?.find(p => p.user_id === user.id)
      if (currentParticipant) {
        setCurrentUser({ id: user.id, role: currentParticipant.role as Role })
      }

      // Fetch messages
      await fetchMessages(roomData.id)

      setLoading(false)

      // Set up realtime subscriptions
      const roomChannel = supabase
        .channel(`room:${roomData.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomData.id}` },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              setRoom(payload.new as Room)
            } else if (payload.eventType === "DELETE") {
              setError("Room has been deleted")
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomData.id}` },
          async () => {
            await fetchParticipants(roomData.id)
            // Re-check current user's role
            const { data: updatedParticipant } = await supabase
              .from("room_participants")
              .select("role")
              .eq("room_id", roomData.id)
              .eq("user_id", user.id)
              .single()
            
            if (updatedParticipant) {
              setCurrentUser({ id: user.id, role: updatedParticipant.role as Role })
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomData.id}` },
          async (payload) => {
            // Fetch the new message with profile
            const { data: newMessage } = await supabase
              .from("messages")
              .select("*, profiles(*)")
              .eq("id", payload.new.id)
              .single()

            if (newMessage) {
              setMessages(prev => [...prev, newMessage as MessageWithProfile])
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(roomChannel)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [roomCode, supabase, fetchRoom, fetchParticipants, fetchMessages])

  return {
    room,
    participants,
    messages,
    currentUser,
    loading,
    error,
    refetchParticipants: () => room && fetchParticipants(room.id),
  }
}
