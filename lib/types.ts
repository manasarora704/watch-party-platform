export type Role = 'host' | 'moderator' | 'participant'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface Room {
  id: string
  code: string
  name: string
  host_id: string
  current_video_id: string | null
  current_video_title: string | null
  is_playing: boolean
  playback_time: number
  created_at: string
  updated_at: string
}

export interface RoomParticipant {
  id: string
  room_id: string
  user_id: string
  role: Role
  joined_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  message_type: 'user' | 'system'
  created_at: string
  profiles?: Profile
}

export interface ParticipantWithProfile extends RoomParticipant {
  profiles: Profile
}
