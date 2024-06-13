const express = require("express");
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const cors = require("cors");
const { UsersDB } = require("./db");
const {
  createRoom,
  getRoomByUserIds,
  deleteRoom,
  getRoomById,
} = require("./rooms");
const { calcCallBill } = require("./billing");

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
  res.status(200).json(Array.from(UsersDB.values()));
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("USER:ONLINE", ({ user }) => {
    console.log("online user", user);
    userIdToSocketIdMap.set(user.id, socket.id);
    console.log(
      "uid to sid",
      Object.fromEntries(userIdToSocketIdMap.entries())
    );
  });

  socket.on("USER:CALLING", ({ fromUser, fromUserId, targetUserId, offer }) => {
    console.log("Received incoming call", { fromUserId, targetUserId, offer });
    const targetUser = UsersDB.get(targetUserId);
    const sourceUser = UsersDB.get(fromUserId);
    console.log({ targetUser, sourceUser });
    if (targetUser && sourceUser) {
      console.log(
        "uid to sid",
        Object.fromEntries(userIdToSocketIdMap.entries())
      );
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
    const { roomId, fromUser, targetUser, offer, answer, createdAt, status } =
      data;
    console.log("Received call accepted by target user", {
      fromUser,
      targetUser,
      answer,
    });
    console.log(
      "uid to sid",
      Object.fromEntries(userIdToSocketIdMap.entries())
    );
    console.log(
      "reverting back to call initiator for call accepted event",
      fromUser
    );
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
      socket.join(roomId);
      io.to(roomId).emit("CALL:STARTED", { ...data, status: "STARTED" });
    }
  });

  socket.on("CALL:NEGOTIATION", (data) => {
    const { roomId, fromUser, targetUser, offer, toUserId, createdAt, status } =
      data;
    console.log("Received call negotiation with offer...", {
      toUserId,
      offer,
    });
    if (!toUserId || !offer) {
      console.log(
        "Error: Invalid user id or offer to send negotiations state..."
      );
      return;
    }
    const shareToSocketId = userIdToSocketIdMap.get(toUserId);
    console.log("Sharing offer back to user", { toUserId, shareToSocketId });
    io.to(shareToSocketId).emit("CALL:ACCEPT_NEGOTIATION", {
      roomId,
      fromUser,
      targetUser,
      offer,
      createdAt,
      status: "NEGOTIATION",
    });
  });

  socket.on("CALL:NEGOTIATION_ANSWER", (data) => {
    const {
      roomId,
      fromUser,
      targetUser,
      offer,
      answer,
      toUserId,
      createdAt,
      status,
    } = data;
    console.log("Received answer for negotiation...", {
      toUserId,
      answer,
    });
    if (!toUserId || !answer) {
      console.log(
        "Error: Invalid user id or answer to send negotiations state..."
      );
      return;
    }
    const shareToSocketId = userIdToSocketIdMap.get(toUserId);
    console.log("Sharing answer back to user", { toUserId, shareToSocketId });
    io.to(shareToSocketId).emit("CALL:FINISH_NEGOTIATION", {
      roomId,
      fromUser,
      targetUser,
      offer,
      answer,
      createdAt,
      status: "FINISH_NEGOTIATION",
    });
  });

  socket.on("CALL:REJECT", (data) => {
    const { roomId, fromUser, targetUser, offer, createdAt, status } = data;
    console.log("Received call rejected by target user", {
      fromUser,
      targetUser,
    });
    console.log(
      "uid to sid",
      Object.fromEntries(userIdToSocketIdMap.entries())
    );
    const revertToSocketId = userIdToSocketIdMap.get(fromUser.id);
    io.to(revertToSocketId).emit("CALL:REJECTED_BY_TARGET", {
      ...data,
      status: "REJECTED",
    });
    if (roomId) {
      socket.to(roomId).emit("CALL:REJECTED", { ...data, status: "REJECTED" });
      socket.leave(roomId);
      deleteRoom(roomId);
    }
  });

  socket.on("CALL:CANCEL", (data) => {
    console.log("Received call cancel event", data);
    if (!data?.targetUserId || !data?.fromUser?.id) {
      console.log("Invalid call object to end...");
      return;
    }
    const targetUser = UsersDB.get(data.targetUserId);
    const sourceUser = UsersDB.get(data.fromUser.id);
    console.log({ targetUser, sourceUser });
    if (targetUser && sourceUser) {
      console.log(
        "uid to sid",
        Object.fromEntries(userIdToSocketIdMap.entries())
      );
      const targetSocketId = userIdToSocketIdMap.get(targetUser.id);
      console.log({ targetSocketId });
      let room = getRoomByUserIds(sourceUser, targetUser);
      if (room) {
        io.to(targetSocketId).emit("CALL:CANCELLED", room);
        socket
          .to(room.roomId)
          .emit("CALL:CANCELLED", { ...data, status: "CANCELLED" });
        socket.leave(room.roomId);
        deleteRoom(room.roomId);
      }
    } else {
      console.log("target user or source user not found!");
    }
  });

  socket.on("CALL:LEAVE_ROOM", (data) => {
    console.log("Received leave call room event", data);
    const { roomId, fromUser, targetUser, offer, createdAt, status } = data;
    if (!roomId) {
      console.log("Invalid leave room id provided...");
      return;
    }
    let room = getRoomById(roomId);
    console.log("Room data:", room);
    console.log("Leaving room...");
    socket.leave(roomId);
    if (room) {
      console.log("Calculating call bill...");
      const user = UsersDB.get(fromUser.id);
      const billAmt = calcCallBill(user, room);
      user.credits -= billAmt;
      UsersDB.set(fromUser.id, user);
      console.log("Updated user details", user);
      const callInitiatorSocketId = userIdToSocketIdMap.get(user.id);
      io.to(callInitiatorSocketId).emit("ACCOUNT:UPDATE_BALANCE", user);
      deleteRoom(roomId);
    }
  });

  socket.on("CALL:END", (data) => {
    console.log("Received call end event", data);
    const { roomId, fromUser, targetUser, offer, createdAt, status } = data;
    if (!targetUser?.id || !fromUser?.id) {
      console.log("Invalid call object to end...");
      return;
    }
    console.log({ targetUser, fromUser });
    if (targetUser && fromUser) {
      console.log(
        "uid to sid",
        Object.fromEntries(userIdToSocketIdMap.entries())
      );
      let room = getRoomById(roomId);
      console.log("Emitting leave room to end call", room);
      socket
        .to(room.roomId)
        .emit("CALL:LEAVE_ROOM_REQUEST", { ...data, status: "ENDED" });
      socket.emit("CALL:LEAVE_ROOM_REQUEST", { ...data, status: "ENDED" });
    } else {
      console.log("target user or source user not found!");
    }
  });
});

server.listen(6080, () => {
  console.log("Express app listening on port 6080");
});
