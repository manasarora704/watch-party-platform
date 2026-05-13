import { WatchRoom } from "@/components/watchio/watch-room"

export default async function WatchPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  
  return <WatchRoom roomCode={code.toUpperCase()} />
}
