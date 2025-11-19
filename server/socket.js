const { Server } = require("socket.io");
let IO;
const activeCallPartners = new Map();

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

      activeCallPartners.set(socket.user, calleeId);
      activeCallPartners.set(calleeId, socket.user);
    });

    socket.on("answerCall", (data) => {
      let callerId = data.callerId;
      let rtcMessage = data.rtcMessage;

      console.log("Call answered by", socket.user, "to caller", callerId);
      socket.to(callerId).emit("callAnswered", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });

      activeCallPartners.set(socket.user, callerId);
      activeCallPartners.set(callerId, socket.user);
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

    socket.on("rejectCall", (data) => {
      const explicitCallerId = data?.callerId;
      const mappedCallerId = activeCallPartners.get(socket.user);
      const callerId = explicitCallerId || mappedCallerId;
      if (callerId) {
        console.log("Call rejected by", socket.user, "for caller", callerId);
        socket.to(callerId).emit("callRejected", {
          callee: socket.user,
        });
        socket.emit("callRejected", {
          callee: socket.user,
        });
        activeCallPartners.delete(socket.user);
        activeCallPartners.delete(callerId);
      } else {
        console.log("Call rejected by", socket.user, "but no caller found");
      }
    });

    socket.on("leaveCall", (data) => {
      const explicitTarget = data?.targetId;
      const mappedTarget = activeCallPartners.get(socket.user);
      const targetId = explicitTarget || mappedTarget;
      if (targetId) {
        console.log("Call ended by", socket.user, "notifying", targetId);
        socket.to(targetId).emit("callEnded", {
          sender: socket.user,
        });
        // also confirm locally so emitter cleans up if needed
        socket.emit("callEnded", {
          sender: socket.user,
        });
        activeCallPartners.delete(socket.user);
        activeCallPartners.delete(targetId);
      } else {
        console.log("Call ended by", socket.user, "but no target found");
      }
    });

    socket.on("disconnect", () => {
      console.log(socket.user, "Disconnected");
      const targetId = activeCallPartners.get(socket.user);
      if (targetId) {
        socket.to(targetId).emit("callEnded", {
          sender: socket.user,
        });
        socket.emit("callEnded", {
          sender: socket.user,
        });
        activeCallPartners.delete(socket.user);
        activeCallPartners.delete(targetId);
      }
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

