# Veep Signaling Server

WebRTC signaling server using Node.js, Express, and Socket.IO.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will start on port 3500 (or the port specified in the `PORT` environment variable).

## Configuration

- Default port: `3500`
- Change port by setting `PORT` environment variable:
  ```bash
  PORT=3000 npm start
  ```

## How it works

The signaling server handles three main events:

1. **`call`** - When a caller initiates a call, sends the offer to the callee
2. **`answerCall`** - When a callee accepts the call, sends the answer back to the caller
3. **`ICEcandidate`** - Exchanges ICE candidates between peers for NAT traversal

## Client Connection

Clients connect with a `callerId` query parameter:
```
socket.io-client.connect('http://your-server:3500', {
  query: { callerId: '12345' }
})
```

## Development

For local development, make sure to:
1. Update the `SERVER_URL` in `src/screens/WebRTCCallScreen.js` to match your local IP address
2. Ensure both devices are on the same network
3. Check firewall settings if connections fail

