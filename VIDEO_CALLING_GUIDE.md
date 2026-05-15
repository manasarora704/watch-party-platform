# Video Calling Features Guide

## Overview
The video calling feature has been significantly enhanced to provide Discord-like and Zoom-like capabilities. Users now have multiple layout options, draggable video windows, zoom controls, and advanced media settings.

## Key Features

### 1. **Multiple Layout Modes**

#### Grid View (Default)
- Displays all participants in a responsive grid layout
- Automatically adjusts grid size based on the number of participants
- Video streams are arranged in rows and columns
- Best for large group calls

#### Focus View
- One large video window with small thumbnail previews at the bottom
- Click on any thumbnail to focus on that participant
- Perfect for presentations or when you want to focus on the main speaker
- Thumbnails are draggable and interactive

#### Picture-in-Picture (PIP) Mode
- All videos are freely draggable within the container
- Each video can be positioned anywhere on the screen
- Videos can be minimized to small buttons
- Similar to Discord's video window behavior
- Best for flexible arrangement

### 2. **Draggable Video Windows**
- In PIP mode, all video windows can be dragged to reposition
- Uses Framer Motion for smooth animations
- Visual indicator shows when a window is draggable (dot in corner)
- Minimized videos can be expanded with a click

### 3. **Video Controls**
Each video window includes:
- **Mute/Unmute Audio** - Control output audio from that participant
- **Minimize** - Collapse to a small button (PIP mode)
- **Close** - Remove remote video streams (for non-local videos)

### 4. **Enhanced Audio/Video Management**

#### Microphone Controls
- Select between multiple microphone inputs
- Test microphone to verify audio levels
- Visual feedback showing if microphone is working
- Real-time audio level detection

#### Camera Controls
- Select between multiple camera inputs
- Choose video quality presets:
  - **HD**: 1280x720 @ 30fps (best quality)
  - **Standard**: 960x540 @ 30fps (balanced)
  - **Low**: 640x360 @ 24fps (low bandwidth)

#### Quick Toggle Buttons
- Audio/Video toggle buttons in the header
- Visual indicators showing enabled/disabled state
- Color-coded (primary color when active, muted when inactive)

### 5. **Advanced Media Settings Dialog**
Access via the settings gear icon with:
- Device selection (microphone and camera)
- Video quality configuration
- Audio/video enable/disable toggles
- Microphone testing with level detection

### 6. **Connection Quality Improvements**
- Multiple STUN servers for better NAT traversal
- Better ICE candidate handling
- Connection state monitoring
- Automatic peer cleanup on connection failure
- Improved error handling and logging

### 7. **Performance Optimizations**
- Codec negotiation for better video quality
- Bundle policy and RTCP mux for efficient streaming
- Adaptive video encoding based on connection
- Efficient track management

## How to Use

### Switching Layouts
1. Look at the bottom-left of the video player
2. Click "Grid", "Focus", or "PIP" buttons to switch between layouts
3. Each layout is optimized for different scenarios

### Using Focus View
1. Click the "Focus" button to activate focus view
2. A large video appears with thumbnails at the bottom
3. Click any thumbnail to make it the focus video
4. Click "Grid" to switch back to grid layout

### Arranging Videos in PIP Mode
1. Click the "PIP" button to activate PIP mode
2. Click and drag any video to reposition it
3. Drag from the entire video window area (cursor changes to grab hand)
4. Click the minimize icon to collapse a video
5. Click the collapsed button to restore the video

### Managing Audio
1. Click the speaker icon above a video to mute/unmute audio from that participant
2. Videos show a red icon when muted
3. Your own video is always muted for you (local audio)

### Accessing Media Settings
1. Click the settings gear icon in the top-right
2. Select your microphone and camera
3. Adjust video quality settings
4. Click "Test Microphone" to verify audio input
5. Click "Save Settings" to apply

## Technical Details

### WebRTC Implementation
- **Signaling**: Supabase Realtime for peer-to-peer signaling
- **Ice Servers**: Google and Twilio STUN servers
- **Peer Connections**: RTCPeerConnection with optimized configuration
- **Media Streams**: MediaStream API for local media capture

### Components
- `VideoGrid.tsx` - Main video grid component with layout switching
- `video-grid.tsx` - Reusable video grid with draggable videos
- `media-settings-dialog.tsx` - Audio/video settings and testing
- `use-webrtc.ts` - WebRTC hook with enhanced features

### State Management
- Local stream state (your camera/microphone)
- Remote streams state (other participants)
- Audio/video enabled state
- Layout mode state
- Focus peer state (in focus view)
- Peer statistics (connection quality)

## Keyboard Shortcuts
- **Enter** in chat input to send message (Shift+Enter for new line)
- **Alt/Option** + **M** - Toggle microphone (when implemented)
- **Alt/Option** + **V** - Toggle camera (when implemented)

## Troubleshooting

### Camera/Microphone Not Working
1. Check browser permissions (Settings > Privacy & Security)
2. Ensure no other applications are using the device
3. Try a different camera/microphone in Media Settings
4. Test microphone using the "Test Microphone" button

### Video Freezing
1. Reduce video quality in Media Settings
2. Check your internet connection speed
3. Close other bandwidth-heavy applications
4. Try switching from Focus to Grid layout

### Audio Echo or Feedback
1. Ensure your speakers/headphones are not near microphone
2. Mute other participants if they're echoing
3. Check if multiple browsers are open (close duplicates)

### Poor Video Quality
1. Check internet connection (should be 2+ Mbps)
2. Increase video quality in Media Settings
3. Reduce number of open video streams
4. Switch to Standard or Low quality preset

## Performance Tips

1. **Use Headphones** - Prevents audio feedback and echo
2. **Reduce Video Quality** - Lower bandwidth usage
3. **Good Lighting** - Makes video clearer
4. **Stable Internet** - Use wired connection if possible
5. **Close Background Apps** - Reduces CPU and bandwidth usage

## Future Enhancements
- Screen sharing
- Background blur/replacement
- Noise suppression
- Video recording
- Snapshot capture
- Peer connection statistics display
- Bandwidth optimization settings
