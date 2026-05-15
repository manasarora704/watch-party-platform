"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface MediaSettings {
  audioInput?: string
  videoInput?: string
  videoWidth?: number
  videoHeight?: number
  frameRate?: number
  videoEnabled: boolean
  audioEnabled: boolean
}

interface MediaSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSettings: MediaSettings
  onSave: (settings: MediaSettings) => void
}

export function MediaSettingsDialog({
  open,
  onOpenChange,
  currentSettings,
  onSave,
}: MediaSettingsDialogProps) {
  const [settings, setSettings] = useState<MediaSettings>(currentSettings)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [testingAudio, setTestingAudio] = useState(false)
  const [testStatus, setTestStatus] = useState<"success" | "error" | null>(null)

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === "audioinput")
        const videoInputs = devices.filter(d => d.kind === "videoinput")
        
        setAudioDevices(audioInputs)
        setVideoDevices(videoInputs)
      } catch (err) {
        console.error("Error enumerating devices:", err)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      getDevices()
    }
  }, [open])

  const handleTestAudio = async () => {
    setTestingAudio(true)
    setTestStatus(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: settings.audioInput }
      })
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      source.connect(analyser)
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let sum = 0
      let count = 0
      
      const testDuration = 1000
      const startTime = Date.now()
      
      const checkAudio = () => {
        if (Date.now() - startTime < testDuration) {
          analyser.getByteFrequencyData(dataArray)
          sum += dataArray.reduce((a, b) => a + b, 0)
          count++
          requestAnimationFrame(checkAudio)
        } else {
          const average = sum / count
          
          stream.getTracks().forEach(t => t.stop())
          audioContext.close()
          
          if (average > 20) {
            setTestStatus("success")
          } else {
            setTestStatus("error")
          }
          setTestingAudio(false)
        }
      }
      
      checkAudio()
    } catch (err) {
      console.error("Error testing audio:", err)
      setTestStatus("error")
      setTestingAudio(false)
    }
  }

  const handleSave = () => {
    onSave(settings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Media Settings</DialogTitle>
          <DialogDescription>
            Configure your camera, microphone, and video quality settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audio Input */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Microphone</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading devices...
              </div>
            ) : (
              <>
                <Select
                  value={settings.audioInput || ""}
                  onValueChange={(value) =>
                    setSettings({ ...settings, audioInput: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAudio}
                  disabled={testingAudio}
                  className="w-full"
                >
                  {testingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Microphone"
                  )}
                </Button>

                {testStatus && (
                  <div
                    className={`flex items-center gap-2 text-sm p-2 rounded ${
                      testStatus === "success"
                        ? "bg-chart-3/10 text-chart-3"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {testStatus === "success" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {testStatus === "success"
                        ? "Microphone is working"
                        : "No audio detected"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Video Input */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Camera</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading devices...
              </div>
            ) : (
              <Select
                value={settings.videoInput || ""}
                onValueChange={(value) =>
                  setSettings({ ...settings, videoInput: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Video Quality */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Video Quality</Label>
              <span className="text-sm text-muted-foreground">
                {settings.videoWidth}x{settings.videoHeight} @ {settings.frameRate}fps
              </span>
            </div>

            <Select
              value={`${settings.videoWidth}x${settings.videoHeight}x${settings.frameRate}`}
              onValueChange={(value) => {
                const [width, height, fps] = value.split("x").map(Number)
                setSettings({
                  ...settings,
                  videoWidth: width,
                  videoHeight: height,
                  frameRate: fps,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1280x720x30">HD (1280x720 @ 30fps)</SelectItem>
                <SelectItem value="960x540x30">Standard (960x540 @ 30fps)</SelectItem>
                <SelectItem value="640x360x24">Low (640x360 @ 24fps)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable Camera</Label>
              <Switch
                checked={settings.videoEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, videoEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Microphone</Label>
              <Switch
                checked={settings.audioEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, audioEnabled: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
