const express = require("express");
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const cors = require("cors");
const { UsersDB } = require("./db");
const { createRoom, getRoomByUserIds, deleteRoom } = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: true,
});

const userIdToSocketIdMap = new Map();

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello..." });
});

app.get("/users-list", (req, res) => {
  res.status(200).json(UsersDB);
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("USER:ONLINE", ({ user }) => {
    console.log("online user", user);
    userIdToSocketIdMap.set(user.id, socket.id);
    console.log("uid to sid", Object.fromEntries(userIdToSocketIdMap.entries()));
  });

  socket.on("USER:CALLING", ({ fromUserId, targetUserId, offer }) => {
    console.log("Received incoming call", { fromUserId, targetUserId, offer });
    const targetUser = UsersDB.find((user) => user.id === targetUserId);
    const sourceUser = UsersDB.find((user) => user.id === fromUserId);
    console.log({ targetUser, sourceUser });
    if (targetUser && sourceUser) {
      console.log("uid to sid", Object.fromEntries(userIdToSocketIdMap.entries()));
      const targetSocketId = userIdToSocketIdMap.get(targetUser.id);
      const sourceSocketId = userIdToSocketIdMap.get(sourceUser.id);
      console.log({ targetSocketId, sourceSocketId });
      let room = getRoomByUserIds(sourceUser, targetUser);
      if (!room) {
        room = createRoom(sourceUser, targetUser);
      }
      room["offer"] = offer;
      console.log("ROOM for users", room);
      socket.join(room.roomId);
      io.to(room.roomId).emit("USER:JOINED", room);
      io.to(targetSocketId).emit("CALL:INCOMING", room);
    } else {
      console.log("target user or source user not found!");
    }
  });

  socket.on("CALL:ACCEPTED", (data) => {
    const { roomId, fromUser, targetUser, offer, answer, createdAt, status } = data;
    console.log("Received call accepted by target user", {
      fromUser,
      targetUser,
      answer,
    });
    console.log("uid to sid", Object.fromEntries(userIdToSocketIdMap.entries()));
    console.log("reverting back to call initiator for call accepted event", fromUser);
    const callInitiatorSocketId = userIdToSocketIdMap.get(fromUser.id);
    const callReceiverSocketId = userIdToSocketIdMap.get(targetUser.id);
    console.log(
      ">> action by socket id",
      socket.id,
      "| initiator socket id",
      callInitiatorSocketId,
      "| called to socket id",
      callReceiverSocketId
    );
    io.to(callInitiatorSocketId).emit("CALL:ACCEPTED_BY_TARGET", {
      ...data,
      status: "ACCEPTED",
    });
    if (roomId) {
      socket.to(roomId).emit("CALL:STARTED", { ...data, status: "ACCEPTED" });
    }
  });

  socket.on("CALL:REJECTED", (data) => {
    const { roomId, fromUser, targetUser, offer, createdAt, status } = data;
    console.log("Received call rejected by target user", {
      fromUser,
      targetUser,
    });
    console.log("uid to sid", Object.fromEntries(userIdToSocketIdMap.entries()));
    const revertToSocketId = userIdToSocketIdMap.get(fromUser.id);
    io.to(revertToSocketId).emit("CALL:REJECTED_BY_TARGET", {
      ...data,
      status: "REJECTED",
    });
    let room = getRoomByUserIds(fromUser, targetUser);
    if (room) {
      socket.to(room.roomId).emit("CALL:ENDED", { ...data, status: "REJECTED" });
      socket.leave(room.roomId);
      deleteRoom(room.roomId);
    }
  });

  socket.on("CALL:END", (data) => {
    console.log("Received call end event", data);
    const targetUser = UsersDB.find((user) => user.id === data.targetUserId);
    const sourceUser = UsersDB.find((user) => user.id === data.fromUser.id);
    console.log({ targetUser, sourceUser });
    if (targetUser && sourceUser) {
      console.log("uid to sid", Object.fromEntries(userIdToSocketIdMap.entries()));
      const targetSocketId = userIdToSocketIdMap.get(targetUser.id);
      console.log({ targetSocketId });
      let room = getRoomByUserIds(sourceUser, targetUser);
      if (room) {
        console.log("Deleting room to end call", room);
        socket.to(room.roomId).emit("CALL:ENDED", { ...data, status: "ENDED" });
        socket.leave(room.roomId);
        deleteRoom(room.roomId);
      }
      io.to(targetSocketId).emit("CALL:ENDED", room);
    } else {
      console.log("target user or source user not found!");
    }
  });
});

server.listen(6080, () => {
  console.log("Express app listening on port 6080");
});
