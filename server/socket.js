const { Server } = require("socket.io");
let IO;

module.exports.initIO = (httpServer) => {
  IO = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  IO.use((socket, next) => {
    if (socket.handshake.query) {
      let callerId = socket.handshake.query.callerId;
      socket.user = callerId;
      next();
    } else {
      next(new Error("callerId is required"));
    }
  });

  IO.on("connection", (socket) => {
    console.log(socket.user, "Connected");
    socket.join(socket.user);

    socket.on("call", (data) => {
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;

      console.log("Call from", socket.user, "to", calleeId);
      socket.to(calleeId).emit("newCall", {
        callerId: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("answerCall", (data) => {
      let callerId = data.callerId;
      let rtcMessage = data.rtcMessage;

      console.log("Call answered by", socket.user, "to caller", callerId);
      socket.to(callerId).emit("callAnswered", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("ICEcandidate", (data) => {
      console.log("ICEcandidate from", socket.user, "to", data.calleeId || data.callerId);
      let targetId = data.calleeId || data.callerId;
      let rtcMessage = data.rtcMessage;

      if (targetId) {
        socket.to(targetId).emit("ICEcandidate", {
          sender: socket.user,
          rtcMessage: rtcMessage,
        });
      } else {
        console.log("Error: No target ID provided for ICE candidate");
      }
    });

    socket.on("disconnect", () => {
      console.log(socket.user, "Disconnected");
    });
  });
};

module.exports.getIO = () => {
  if (!IO) {
    throw Error("IO not initialized.");
  } else {
    return IO;
  }
};

