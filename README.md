# 🎬 Watchio — YouTube Watch Party Platform

> **Intern Assignment Submission** — Real-time synchronized YouTube watch party system with WebSocket-based communication, role-based access control, live chat, and peer-to-peer voice/video.

**🌐 Live URL:** `[https://your-watchio-app.vercel.app](https://watch-party-platform.vercel.app/)` 
---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [WebSocket / Realtime Events](#websocket--realtime-events)
- [Role-Based Access Control](#role-based-access-control)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup & Run](#local-setup--run)
- [Supabase Database Setup](#supabase-database-setup)
- [Environment Variables](#environment-variables)
- [Deployment (Vercel)](#deployment-vercel)
- [Bonus Features Implemented](#bonus-features-implemented)
- [Trade-offs & Design Decisions](#trade-offs--design-decisions)
- [Screenshots](#screenshots)

---

## Overview

**Watchio** is a full-stack, real-time watch party platform built for the intern assignment. It allows multiple users to watch YouTube videos together in sync — when the host plays, pauses, seeks, or changes the video, all participants instantly reflect that state.

Key implementation choices:
- **No sign-up required** — users enter a nickname and get a guest session via an HTTP-only cookie (`watchio_device_id`), removing friction while still supporting full RBAC.
- **Supabase Realtime** is used as the WebSocket layer — it wraps PostgreSQL logical replication and a Broadcast channel, giving both persistent room state and ephemeral real-time events without running a separate WebSocket server.
- **Next.js Server Actions** enforce all RBAC rules on the server before any database mutation.

---

## Features

| ✅ | Feature |
|---|---------|
| 🏠 | Create a watch party room — creator becomes **Host** automatically |
| 🔗 | Join by 6-character room code or shareable link |
| ▶️ | Synchronized YouTube playback (play, pause, seek, change video) |
| 🛡️ | Full RBAC: **Host → Moderator → Participant** with enforced server-side permissions |
| 👑 | Host can promote/demote participants, transfer host, remove participants |
| 💬 | Real-time chat with **optimistic UI** (messages appear instantly) |
| 😄 | Full emoji picker integrated into chat |
| 🎤 | **Voice & Video Chat** via WebRTC (peer-to-peer, signaled through Supabase Broadcast) |
| 👥 | Live participant list with online presence indicators |
| 🎨 | Premium UI — glass-morphism, role-colored chat names, role badges, micro-animations |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                     │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  WatchRoom   │   │  useRoom     │   │  useWebRTC     │  │
│  │  Component   │◄──│  Hook        │   │  Hook          │  │
│  │              │   │  (Realtime   │   │  (WebRTC P2P   │  │
│  │  YouTube     │   │   subs)      │   │   via Supabase │  │
│  │  IFrame API  │   └──────┬───────┘   │   Broadcast)   │  │
│  └──────────────┘          │           └───────┬────────┘  │
│                             │                   │            │
└─────────────────────────────┼───────────────────┼────────────┘
                              │                   │
              ┌───────────────▼───────────────────▼──────────────┐
              │              Supabase (BaaS)                       │
              │                                                    │
              │   ┌──────────────┐   ┌──────────────────────────┐ │
              │   │  PostgreSQL  │   │  Realtime Engine          │ │
              │   │  (rooms,     │   │  ┌───────────────────┐   │ │
              │   │  messages,   │   │  │ postgres_changes   │   │ │
              │   │  profiles,   │   │  │ (DB mutations)    │   │ │
              │   │  room_       │   │  ├───────────────────┤   │ │
              │   │  participants│   │  │ Broadcast channel │   │ │
              │   │  )           │   │  │ (playback_sync,   │   │ │
              │   └──────────────┘   │  │  WebRTC signals)  │   │ │
              │                      │  └───────────────────┘   │ │
              │                      └──────────────────────────┘ │
              └────────────────────────────────────────────────────┘
                              ▲
              ┌───────────────┴──────────┐
              │   Next.js Server Actions  │
              │   (RBAC enforced here)    │
              │   - createRoom            │
              │   - joinRoom              │
              │   - sendMessage           │
              │   - syncPlayback          │
              │   - updateParticipantRole │
              │   - removeParticipant     │
              └──────────────────────────┘
```

### How Real-Time Sync Works

1. **Host** presses Play → `handleStateChange` fires → calls `emitPlaybackSync` (Supabase Broadcast, instant) **+** `syncPlayback` (Server Action → persists to DB for late joiners)
2. **Supabase Realtime** broadcasts `playback_sync` event to all subscribers on `room:{id}` channel
3. **All guests** receive the broadcast in `useRoom` hook → call `player.playVideo()` / `player.seekTo()`
4. **New joiners** receive the current state from the DB (stored `is_playing`, `playback_time`, `current_video_id`)

---

## WebSocket / Realtime Events

> Instead of raw Socket.IO, this project uses **Supabase Realtime** which provides the same bidirectional WebSocket semantics through `postgres_changes` (DB-level) and `Broadcast` (ephemeral) channels.

### Broadcast Events (Ephemeral — via `room:{roomId}` channel)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `playback_sync` | Server → Clients | `{ is_playing, playback_time }` | Instant play/pause/seek broadcast |
| `signal` (type: `join`) | Client → Server | `{ from: userId }` | WebRTC: peer announces presence |
| `signal` (type: `offer`) | Client → Client | `{ from, target, data: RTCOffer }` | WebRTC: SDP offer |
| `signal` (type: `answer`) | Client → Client | `{ from, target, data: RTCAnswer }` | WebRTC: SDP answer |
| `signal` (type: `ice-candidate`) | Client → Client | `{ from, target, data: IceCandidate }` | WebRTC: ICE candidate exchange |
| `signal` (type: `leave`) | Client → Server | `{ from: userId }` | WebRTC: peer leaving call |

### postgres_changes Events (Persistent — DB triggers)

| Table | Event | What triggers a UI update |
|-------|-------|--------------------------|
| `rooms` | `UPDATE` | Video changed, playback state updated |
| `rooms` | `DELETE` | Host deleted the room → redirect all |
| `room_participants` | `INSERT/UPDATE/DELETE` | Participant joined, role changed, removed |
| `messages` | `INSERT` | New chat message → append to chat |

### Server Action Equivalents (REST-like, RBAC enforced)

| Action | Corresponds to assignment event | Permission |
|--------|---------------------------------|------------|
| `createRoom` | `join_room` (creator) | Anyone (guest) |
| `joinRoom` | `join_room` (joiner) | Anyone (guest) |
| `syncPlayback` | `play` / `pause` / `seek` | Host, Moderator |
| `updateVideo` | `change_video` | Host, Moderator |
| `sendMessage` | `chat_message` | All |
| `updateParticipantRole` | `assign_role` | Host only |
| `removeParticipant` | `remove_participant` | Host only |
| `leaveRoom` | `leave_room` | All |

---

## Role-Based Access Control

### Roles

| Role | Assigned By | Permissions |
|------|-------------|-------------|
| **Host** | Auto (room creator) | Play/Pause, Seek, Change Video, Assign Roles, Remove Participants, Transfer Host |
| **Moderator** | Host | Play/Pause, Seek, Change Video |
| **Participant** | Default for joiners | Watch only — no playback control |

### How it's enforced (server-side)

Every state-mutating action first calls `getGuestSession()` to retrieve the `userId` from the HTTP-only cookie, then queries `room_participants` to verify the user's role **before** executing any DB operation:

```typescript
// lib/actions/rooms.ts (simplified)
export async function syncPlayback(roomId: string, isPlaying: boolean, time: number) {
  const userId = await getGuestSession()
  if (!userId) return { error: "Not authenticated" }

  const { data: participant } = await supabase
    .from("room_participants")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single()

  // ✅ Server-side RBAC — reject if not host or moderator
  if (!participant || !["host", "moderator"].includes(participant.role)) {
    return { error: "Insufficient permissions" }
  }

  await supabase.from("rooms").update({ is_playing: isPlaying, playback_time: time }).eq("id", roomId)
}
```

### UI Enforcement (client-side)

```typescript
const canChangeVideo = currentUser?.role === "host" || currentUser?.role === "moderator"
const canManageRoles = currentUser?.role === "host"

// YouTube player controls are disabled for participants:
controls: canChangeVideo ? 1 : 0,
disablekb: canChangeVideo ? 0 : 1,
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 14 (App Router) | Full-stack — Server Actions eliminate a separate Express server |
| **Language** | TypeScript | Type-safety across frontend + server actions |
| **Realtime / WebSockets** | Supabase Realtime | Postgres `postgres_changes` + Broadcast channels = WebSocket without a separate WS server |
| **Database** | PostgreSQL (via Supabase) | Persistent rooms, messages, participants |
| **Auth** | Custom cookie-based guest sessions | No sign-up friction; HTTP-only `watchio_device_id` cookie |
| **Voice/Video** | WebRTC (browser-native) | Peer-to-peer calls; Supabase Broadcast used for signaling |
| **State** | Zustand + React hooks | Lightweight, no boilerplate |
| **Animations** | Framer Motion | Sidebar slide, message transitions |
| **Icons** | Lucide React | Consistent, tree-shakeable |
| **Emoji Picker** | `emoji-picker-react` | Native emoji support in chat |
| **Styling** | Tailwind CSS + custom CSS | Utility-first + glass-morphism tokens |
| **Deployment** | Vercel | Zero-config Next.js deployment |

---

## Project Structure

```
watch-party-platform/
│
├── app/
│   ├── layout.tsx                  # Root layout + font
│   ├── page.tsx                    # Landing page (set nickname)
│   └── rooms/
│       ├── page.tsx                # Room dashboard (create/join)
│       └── [code]/
│           └── page.tsx            # Watch room page
│
├── components/
│   └── watchio/
│       ├── rooms.tsx               # Create/Join room UI
│       └── watch-room.tsx          # Main watch party UI
│           ├── WatchRoom()         # Root component
│           ├── VideoStream()       # WebRTC video tile
│           ├── ParticipantItem()   # Participant row + role dropdown
│           ├── RoleBadge()         # Inline role chip
│           └── RoleIcon()          # Crown/Shield/User icon
│
├── hooks/
│   ├── use-room.ts                 # Supabase subscriptions, optimistic chat
│   └── use-webrtc.ts              # WebRTC peer management + media
│
├── lib/
│   ├── actions/
│   │   ├── auth.ts                 # setGuestSession / getGuestSession
│   │   └── rooms.ts               # All server actions (RBAC enforced)
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client (SSR cookies)
│   │   └── middleware.ts           # Session refresh middleware
│   └── types.ts                    # Shared TypeScript types
│
├── schema.sql                      # Full DB schema (run in Supabase SQL editor)
├── middleware.ts                   # Next.js middleware (session handling)
├── .env.local                      # Local environment variables
└── README.md
```

---

## Local Setup & Run

### 1. Clone & Install

```bash
git clone https://github.com/your-username/watch-party-platform.git
cd watch-party-platform
npm install
# or: pnpm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon/Public Key** from `Settings → API`

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up the Database

Open the Supabase **SQL Editor** and run the full contents of `schema.sql`:

```sql
-- Creates: profiles, rooms, room_participants, messages
-- Enables: Realtime publication for all tables
-- Disables: RLS (RBAC is enforced in Server Actions)
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — enter a nickname, create a room, and share the 6-character code with friends!

> **Test multi-user locally:** Open the room in multiple browser tabs (use Incognito for a second guest identity). Each tab gets its own cookie-based guest session.

---

## Supabase Database Setup

### Schema Summary

```sql
-- Profiles: one row per device (UUID from cookie)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT,
  ...
);

-- Rooms: persistent state including current video + playback position
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,          -- 6-char join code
  name TEXT NOT NULL,
  host_id UUID REFERENCES profiles(id),
  current_video_id TEXT,              -- YouTube video ID
  is_playing BOOLEAN DEFAULT false,
  playback_time NUMERIC DEFAULT 0,
  ...
);

-- Room Participants: join table with RBAC role
CREATE TABLE room_participants (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('host', 'moderator', 'participant')),
  UNIQUE(room_id, user_id)
);

-- Messages: chat history
CREATE TABLE messages (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('user', 'system')),
  ...
);
```

> **RLS is intentionally disabled** — all security is enforced at the Next.js Server Action layer via the guest cookie.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

> ⚠️ Never commit `.env.local` — it's already in `.gitignore`.

---

## Deployment (Vercel)

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "feat: watchio watch party platform"
git push origin main
```

### Step 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Vercel auto-detects Next.js — no configuration needed.

### Step 3 — Update your live URL here

```
🌐 Live URL: https://your-watchio-app.vercel.app
```

> **WebRTC in production:** WebRTC works over HTTPS (which Vercel provides by default). The STUN servers used (`stun.l.google.com:19302`) are public and free — no additional setup needed.

---

## Bonus Features Implemented

| Bonus | Status | Details |
|-------|--------|---------|
| **Text Chat** | ✅ Done | Real-time with optimistic UI — messages appear instantly before DB confirmation |
| **Emoji Reactions** | ✅ Done | Full emoji picker via `emoji-picker-react` |
| **Transfer Host** | ✅ Done | Host can promote any participant to Host via the People panel |
| **Persistent Rooms** | ✅ Done | Rooms stored in PostgreSQL; new joiners get synced state from DB |
| **Voice & Video Chat** | ✅ Done | WebRTC P2P via Supabase Broadcast signaling; Mic/Cam toggle buttons in header |
| **Remove Participant** | ✅ Done | Host can remove participants from the People panel |
| **Online Presence** | ✅ Done | Supabase Presence shows green/grey dot per participant |

---

## Trade-offs & Design Decisions

### 1. Supabase Realtime vs. Socket.IO

**Choice:** Supabase Realtime (Broadcast + postgres_changes)

**Why:** Since the stack is already Next.js + Supabase, adding a separate Socket.IO server (on Render/Railway) would introduce another service to deploy and maintain. Supabase Broadcast provides equivalent bidirectional WebSocket semantics with zero additional infrastructure.

**Trade-off:** Supabase Realtime has a message size limit (~2MB) and slightly higher latency than a dedicated Socket.IO server on the same network. For a watch party (small payloads), this is entirely acceptable.

### 2. Cookie-based Guest Auth vs. Supabase Auth

**Choice:** Custom HTTP-only cookie (`watchio_device_id`) storing a UUID.

**Why:** The assignment emphasizes frictionless joining. Supabase Anonymous Auth requires a round-trip to create an auth token. A simple UUID cookie achieves the same "persistent guest identity" with one line of code and zero API calls.

**Trade-off:** Clearing cookies resets identity. For a production app, we'd add optional account linking.

### 3. Server Actions vs. REST API Routes

**Choice:** Next.js Server Actions for all mutations.

**Why:** Eliminates a separate Express/Fastify backend. Server Actions run on the server, so RBAC checks cannot be bypassed by a client. They also automatically have access to the request cookies (for the guest session).

**Trade-off:** Server Actions are Next.js-specific. Migrating to a separate backend would require rewriting to REST/GraphQL.

### 4. Optimistic UI for Chat

**Choice:** Messages are added to local state immediately; DB write happens asynchronously.

**Why:** Eliminates perceived latency — the UX feels like Socket.IO even though the underlying transport is HTTP + Realtime subscription.

**Trade-off:** If the DB write fails, the optimistic message stays visible briefly until the next Realtime event reconciles state.

---

## Screenshots

> _Add screenshots or a Loom demo video link here_

| Create Room | Watch Party | Chat + Emoji | Role Management |
|-------------|-------------|--------------|-----------------|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## How to Demo

1. Open the live URL in **Tab A** → Enter nickname → Create Room
2. Copy the 6-character room code
3. Open the live URL in **Incognito / Tab B** → Enter different nickname → Join with code
4. In Tab A (Host): Paste a YouTube URL → Click "Change Video"
5. Both tabs will sync immediately
6. In Tab A: Press Play/Pause — Tab B follows
7. In Tab A: Open "People" panel → Promote Tab B's user to Moderator
8. Now Tab B can also control playback
9. Click the Mic 🎤 button in either tab to start a voice call between participants

---

## License

MIT — built for the Intern Assignment submission.
