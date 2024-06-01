const express = require("express");
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const cors = require("cors");
const { UsersDB } = require("./db");
const { createRoom, getRoomByUserIds } = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: true,
});

const userIdToSocketIdMap = new Map();
const socketIdToUserIdMap = new Map();

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
    socketIdToUserIdMap.set(socket.id, user.id);
  });

  socket.on("USER:CALLING", (data) => {
    console.log("Received incoming call", data);
    const targetUser = UsersDB.find((user) => user.id === data.targetUserId);
    const sourceUser = UsersDB.find((user) => user.id === data.fromUserId);
    console.log({ getValidTargetUser: targetUser });
    if (targetUser) {
      const targetSocketId = userIdToSocketIdMap.get(targetUser.id);
      console.log({ targetSocketId });
      let room = getRoomByUserIds(sourceUser, targetUser);
      if (!room) {
        room = createRoom(sourceUser, targetUser);
      }
      socket.join(room.id);
      io.to(room.id).emit("USER:JOINED", room);
      io.to(targetSocketId).emit("CALL:INCOMING", room);
    }
  });
});

server.listen(6080, () => {
  console.log("Express app listening on port 6080");
});
