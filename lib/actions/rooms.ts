"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Role } from "@/lib/types"

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createRoom(name: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Generate unique room code
  let code = generateRoomCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .single()
    
    if (!existing) break
    code = generateRoomCode()
    attempts++
  }

  // Create room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code,
      name,
      host_id: user.id,
    })
    .select()
    .single()

  if (roomError) {
    return { error: roomError.message }
  }

  // Add host as participant
  const { error: participantError } = await supabase
    .from("room_participants")
    .insert({
      room_id: room.id,
      user_id: user.id,
      role: "host" as Role,
    })

  if (participantError) {
    return { error: participantError.message }
  }

  // Add system message
  await supabase.from("messages").insert({
    room_id: room.id,
    user_id: user.id,
    content: "Room created! Share the code to invite friends.",
    message_type: "system",
  })

  revalidatePath("/rooms")
  return { room }
}

export async function joinRoom(code: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Find room by code
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single()

  if (roomError || !room) {
    return { error: "Room not found" }
  }

  // Check if already a participant
  const { data: existingParticipant } = await supabase
    .from("room_participants")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .single()

  if (existingParticipant) {
    return { room }
  }

  // Add as viewer
  const { error: participantError } = await supabase
    .from("room_participants")
    .insert({
      room_id: room.id,
      user_id: user.id,
      role: "viewer" as Role,
    })

  if (participantError) {
    return { error: participantError.message }
  }

  // Get user profile for system message
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  // Add system message
  await supabase.from("messages").insert({
    room_id: room.id,
    user_id: user.id,
    content: `${profile?.username || "Someone"} joined the room`,
    message_type: "system",
  })

  revalidatePath(`/watch/${room.code}`)
  return { room }
}

export async function updateVideo(roomId: string, videoId: string, videoTitle?: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Check user role
  const { data: participant } = await supabase
    .from("room_participants")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single()

  if (!participant || participant.role === "viewer") {
    return { error: "You don't have permission to change the video" }
  }

  // Update room
  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      current_video_id: videoId,
      current_video_title: videoTitle || null,
      playback_time: 0,
      is_playing: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Get user profile for system message
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  // Add system message
  await supabase.from("messages").insert({
    room_id: roomId,
    user_id: user.id,
    content: `${profile?.username || "Someone"} changed the video`,
    message_type: "system",
  })

  return { success: true }
}

export async function updateParticipantRole(roomId: string, targetUserId: string, newRole: Role) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Check if current user is host
  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    return { error: "Only the host can change roles" }
  }

  // If transferring host
  if (newRole === "host") {
    // Update room host
    await supabase
      .from("rooms")
      .update({ host_id: targetUserId })
      .eq("id", roomId)

    // Update old host to moderator
    await supabase
      .from("room_participants")
      .update({ role: "moderator" })
      .eq("room_id", roomId)
      .eq("user_id", user.id)
  }

  // Update target user role
  const { error: updateError } = await supabase
    .from("room_participants")
    .update({ role: newRole })
    .eq("room_id", roomId)
    .eq("user_id", targetUserId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Get profiles for system message
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [user.id, targetUserId])

  const currentUserProfile = profiles?.find(p => p.id === user.id)
  const targetUserProfile = profiles?.find(p => p.id === targetUserId)

  // Add system message
  let message = ""
  if (newRole === "host") {
    message = `${currentUserProfile?.username} transferred host to ${targetUserProfile?.username}`
  } else if (newRole === "moderator") {
    message = `${targetUserProfile?.username} is now a moderator`
  } else {
    message = `${targetUserProfile?.username} is now a viewer`
  }

  await supabase.from("messages").insert({
    room_id: roomId,
    user_id: user.id,
    content: message,
    message_type: "system",
  })

  return { success: true }
}

export async function sendMessage(roomId: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  const { error: messageError } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      user_id: user.id,
      content,
      message_type: "user",
    })

  if (messageError) {
    return { error: messageError.message }
  }

  return { success: true }
}

export async function leaveRoom(roomId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Get user profile for system message
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  // Check if user is host
  const { data: room } = await supabase
    .from("rooms")
    .select("host_id")
    .eq("id", roomId)
    .single()

  if (room?.host_id === user.id) {
    // If host is leaving, delete the room
    await supabase.from("rooms").delete().eq("id", roomId)
    return { success: true, roomDeleted: true }
  }

  // Remove participant
  await supabase
    .from("room_participants")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id)

  // Add system message
  await supabase.from("messages").insert({
    room_id: roomId,
    user_id: user.id,
    content: `${profile?.username || "Someone"} left the room`,
    message_type: "system",
  })

  return { success: true }
}

export async function syncPlayback(roomId: string, isPlaying: boolean, playbackTime: number) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: "Not authenticated" }
  }

  // Check user role
  const { data: participant } = await supabase
    .from("room_participants")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single()

  if (!participant || participant.role === "viewer") {
    return { error: "You don't have permission to control playback" }
  }

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      is_playing: isPlaying,
      playback_time: playbackTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}
