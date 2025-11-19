# Veep – Real-Time Video Calling App

Veep is a React Native application that delivers end-to-end WebRTC video calling using a lightweight Express + Socket.IO signaling server. It’s optimized for real devices on the same network, supports full two-way audio/video with ringtone/ringback logic, and includes in-call controls such as mute, camera toggle, and speaker selection.

---

## ✨ Feature Overview

### Real-time communication
- Bi-directional video/audio via `react-native-webrtc`
- Automatic ICE candidate exchange over Socket.IO
- TURN/STUN pre-configured for NAT traversal

### Call experience
- 6-digit caller IDs generated per session
- Outgoing ring-back beep + incoming ringtone
- Accept / Reject UI with 30-second timeout
- Automatic cleanup when either party hangs up
- Controls: hang-up, mute/unmute, video on/off, camera switch, speaker/ear toggle

### Platform support
- Android & iOS devices and emulators
- Camera/mic permission handling (`react-native-permissions`)
- Works cross-platform (Android ↔ iOS)

### Code structure highlights
- `WebRTCCallScreen` – complete call flow (join, outgoing, incoming, in-call)
- `src/config/server.js` – smart server URL resolver with LAN IP fallback
- `server/socket.js` – Express + Socket.IO signaling server (call/new/answer/reject/hangup)
- `src/services/webrtc.js` – shared WebRTC helpers (TURN/STUN config etc.)

---

## 🧱 Architecture

```
 ┌────────────┐        WebRTC (media)        ┌────────────┐
 │  Device A  │  <========================>  │  Device B  │
 │ ReactNative│                              │ ReactNative│
 └─────▲──────┘                              └────▲───────┘
       │   Socket.IO (signaling, caller IDs)      │
       └──────────────────────────────────────────┘
                            │
                     ┌────────────┐
                     │ Express +  │
                     │ Socket.IO  │
                     │ Signaling  │
                     └────────────┘
```

Media flows peer-to-peer via WebRTC; the Node server only handles signaling events and call state (call initiated, answered, rejected, leave/hangup).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js ≥ 20
- React Native CLI environment (Android Studio, Xcode if on macOS)
- Physical devices recommended for full camera/mic testing

### 2. Install dependencies
```bash
npm install
```

### 3. Configure server URL
Edit `src/config/server.js` (or set `SERVER_IP`) so real devices hit your LAN IP. By default the app tries:
1. `http://192.168.60.111:3500` (replace with your machine’s IP)
2. Fallback IP list (192.168.x.y, 192.168.0.y, etc.)
3. Emulator loopback (10.0.2.2) only if `RN_USE_EMULATOR_HOST=true`

To find your IP (macOS):
```bash
ifconfig | grep "inet 192"
```

### 4. Start signaling server
```bash
cd server
npm install
npm start    # runs on port 3500
```

### 5. Run the app
```bash
# Android
npm run android

# iOS
npm run ios
```

Grant camera/microphone permissions when prompted.

---

## 📱 Using the App

1. **Join screen**
   - Displays your random 6-digit Caller ID
   - Enter another user’s Caller ID and tap “Call Now”

2. **Outgoing state**
   - Caller hears a short repeating ring-back beep
   - If callee doesn’t respond within 30s, both sides auto-cleanup

3. **Incoming state**
   - Device plays ringtone until Accept or Reject
   - Reject notifies caller immediately; Accept starts the call

4. **In-call screen**
   - Fullscreen local/remote video using `RTCView`
   - Controls:
     - 🔴 Hang up
     - 🎙️ Mute/unmute (also toggles OS microphone)
     - 🎥 Video enable/disable
     - 🔄 Switch camera (front/back)
     - 🔈 Toggle speaker vs earpiece (via `InCallManager`)

---

## 🔧 Configuration Details

### TURN/STUN servers (`src/services/webrtc.js`)
```js
export const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:relay1.expressturn.com:3478',
    username: 'expressturn',
    credential: 'expressturn',
  },
];
```
For production: host your own TURN server and secure it with credentials/rotation.

### Android permissions
Declared in `android/app/src/main/AndroidManifest.xml` (camera, audio, internet, wake lock). Ensure you run on Android 12+ with `RECEIVER_NOT_EXPORTED` semantics applied via our patched socket module.

### iOS permissions
Add camera/mic descriptions in `Info.plist`. The app already expects them.

---

## 🧪 Testing Tips

- **Real devices**: Both must be on same Wi-Fi (or use a public server). Open `http://YOUR_IP:3500` in the phone’s browser to verify connectivity.
- **Emulator**: use `adb reverse tcp:3500 tcp:3500` or set `RN_USE_EMULATOR_HOST=true` to stick with `10.0.2.2`.
- **Ringtone/ringback**: confirm caller hears short beep, callee hears full ringtone.
- **Timeout**: leave incoming call ringing for 30s; both devices should exit automatically.
- **Edge cases**: reject from either side, close app mid-call, switch cameras repeatedly.

---

## 🗂 Project Structure

```
veep/
├── App.tsx
├── README.md
├── server/
│   ├── index.js        # Express bootstrap
│   └── socket.js       # Socket.IO event handlers
└── src/
    ├── config/
    │   └── server.js   # SERVER_URL auto-resolution
    ├── screens/
    │   ├── HomeScreen.js
    │   └── WebRTCCallScreen.js
    ├── services/
    │   └── webrtc.js
    ├── asset/          # SVG icons (CallAnswer, CallEnd, etc.)
    └── styles/         # global styles + colors
```

Legacy Firebase hooks (`src/hooks/useWebRTC.js`) remain for reference but aren’t wired into the current navigation flow. The active app path is `HomeScreen → WebRTCCallScreen`.

---

## 🔐 Hardening for Production

- Run the signaling server behind HTTPS/WSS (e.g., Nginx + certs)
- Add authentication before allowing call setup
- Rate-limit caller ID generation
- Host a dedicated TURN server (coturn, Twilio, etc.)
- Log signaling events for diagnostics
- Handle push notifications for background ringing (not included here)

---

## 🛠 Troubleshooting

**Phone can’t connect to server**
- Verify `SERVER_URL` is set to your LAN IP
- Check firewall rules on your machine
- Confirm `npm start` is running inside `/server`

**No audio/video**
- Test on real devices (simulators often block camera/mic)
- Ensure permissions were granted (Settings → App → Permissions)
- Check console logs for WebRTC errors

**Ring keeps playing after reject/accept**
- Ensure both devices are on latest build; ring sounds stop via `stopAllRingSounds()` when call states change

---

## 📦 Key Dependencies

### Client
- `react-native-webrtc`
- `socket.io-client`
- `react-native-incall-manager`
- `@react-navigation/native`, `@react-navigation/native-stack`
- `react-native-permissions`

### Server
- `express`
- `socket.io`
- `cors`

---

## 🙌 Contributing / Support

1. File issues or feature requests via your preferred tracker.
2. Include device logs when reporting WebRTC problems.
3. For major changes (e.g., new signaling behavior) update both client and server.

---

## ✅ Checklist Before Shipping

- [ ] Server deployed with HTTPS/WSS
- [ ] TURN server ready and authenticated
- [ ] Domain/IP whitelisted in `src/config/server.js`
- [ ] Tested on at least one Android + one iOS physical device
- [ ] App icons/splash updated
- [ ] Firebase hooks removed or refactored if unused
- [ ] Crash/error logging added (Sentry, Bugsnag, etc.)

---

Thanks for building with Veep! 🎥📞  
