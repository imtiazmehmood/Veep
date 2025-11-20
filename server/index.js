const path = require('path');
const { createServer } = require('http');
const express = require('express');
const { getIO, initIO } = require('./socket');

const app = express();

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Veep Signaling Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      websocket: 'Connect via Socket.IO with callerId query parameter'
    }
  });
});

// Serve static files if needed
app.use('/static', express.static(path.join(__dirname, 'static')));

const httpServer = createServer(app);

let port = process.env.PORT || 3500;

initIO(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  console.log("Server started on port", port);
  console.log("Server is accessible on all network interfaces");
  console.log("For local network access, use your machine's IP address (e.g., http://192.168.x.x:3500)");
});

getIO();

