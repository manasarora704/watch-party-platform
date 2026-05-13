"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@/lib/supabase/server"

export async function setGuestSession(username: string) {
  const cookieStore = await cookies()
  let userId = cookieStore.get("watchio_device_id")?.value

  if (!userId) {
    userId = uuidv4()
    cookieStore.set("watchio_device_id", userId, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
  }

  // Create or update the custom profile
  const supabase = await createClient()
  await supabase.from("profiles").upsert({
    id: userId,
    username: username,
  })

  return { userId, username }
}

export async function getGuestSession() {
  const cookieStore = await cookies()
  return cookieStore.get("watchio_device_id")?.value
}
