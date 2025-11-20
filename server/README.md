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

## Deployment to Render

### Option 1: Using Render Blueprint (Recommended)

The repository includes a `render.yaml` file for easy deployment:

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Select the repository and branch
6. Render will automatically detect `render.yaml` and configure the service
7. Click **Apply** to deploy

### Option 2: Manual Web Service Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `veep-signaling-server` (or your preferred name)
   - **Root Directory**: `server` (if deploying from monorepo)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Create Web Service**

### After Deployment

1. **Get your server URL**: Render will provide a URL like `https://veep-signaling-server.onrender.com`
2. **Update your client app**: Change the `SERVER_URL` in your React Native app to point to your Render URL
3. **Test the connection**: 
   - Visit `https://your-app.onrender.com/health` to verify the server is running
   - Test Socket.IO connection from your mobile app

### Environment Variables

No environment variables are required for basic operation. The `PORT` is automatically set by Render.

Optional environment variables:
- `NODE_ENV`: Set to `production` (automatically configured in `render.yaml`)

### Monitoring

- **Health Check**: The server exposes a `/health` endpoint that Render uses to monitor service health
- **Logs**: View real-time logs in the Render Dashboard under your service
- **Metrics**: Monitor CPU, memory, and bandwidth usage in the Render Dashboard

### Troubleshooting

**Server not starting:**
- Check Render logs for errors
- Verify `package.json` has correct dependencies
- Ensure Node.js version is compatible (>=18.0.0)

**Socket.IO connection fails:**
- Verify CORS settings in `socket.js`
- Check that client is using the correct Render URL
- Ensure client includes `callerId` in connection query

**Free tier limitations:**
- Render's free tier spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for production use

