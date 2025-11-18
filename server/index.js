const path = require('path');
const { createServer } = require('http');
const express = require('express');
const { getIO, initIO } = require('./socket');

const app = express();

// Serve static files if needed
app.use('/', express.static(path.join(__dirname, 'static')));

const httpServer = createServer(app);

let port = process.env.PORT || 3500;

initIO(httpServer);

httpServer.listen(port, '0.0.0.0', () => {
  console.log("Server started on port", port);
  console.log("Server is accessible on all network interfaces");
  console.log("For local network access, use your machine's IP address (e.g., http://192.168.x.x:3500)");
});

getIO();

