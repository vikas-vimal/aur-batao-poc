const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
});

app.use(cors());
app.use(express.json());
app.use("/peerjs", peerServer);

const PORT = process.env.PORT || 3000;

// In-memory storage for active calls and user credits
const activeCalls = new Map();
const userCredits = new Map();
const users = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (userId) => {
    socket.userId = userId;
    console.log(`User ${userId} joined`);
    if (!users.has(userId)) {
      users.set(userId, { id: userId, name: `User ${userId.substr(0, 5)}` });
      addCredits(userId, 10);
    }
  });

  socket.on("call-user", (data) => {
    const { callerId, calleeId } = data;
    io.to(calleeId).emit("incoming-call", { callerId });
  });

  socket.on("call-accepted", (data) => {
    const { callerId, calleeId } = data;
    io.to(callerId).emit("call-accepted", { calleeId });

    // Start tracking call duration
    const startTime = Date.now();
    activeCalls.set(callerId, { calleeId, startTime });
  });

  socket.on("call-ended", (data) => {
    const { callerId } = data;
    handleCallEnd(callerId);
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
    if (activeCalls.has(socket.userId)) {
      handleCallEnd(socket.userId);
    }
    // Remove user data from map data structures
    users.delete(socket.userId);
    userCredits.delete(socket.userId);
    console.log(`Removed data for user ${socket.userId}`);
  });
});

function handleCallEnd(callerId) {
  if (activeCalls.has(callerId)) {
    const { startTime, calleeId } = activeCalls.get(callerId);
    const duration = (Date.now() - startTime) / 1000; // duration in seconds

    // Deduct credits (assuming 1 credit per minute)
    const creditsToDeduct = Math.ceil(duration / 60);
    deductCredits(callerId, creditsToDeduct);

    console.log(
      `Call ended. Duration: ${duration} seconds. Credits deducted: ${creditsToDeduct}`
    );

    activeCalls.delete(callerId);
    io.to(callerId).emit("call-ended", {
      duration,
      creditsDeducted: creditsToDeduct,
    });
    io.to(calleeId).emit("call-ended", { duration, creditsDeducted: 0 }); // Notify callee as well
  }
}

function addCredits(userId, credits) {
  console.log("add credits request", { userId, credits });
  const currentCredits = userCredits.get(userId) || 0;
  const newBalance = currentCredits + credits;
  userCredits.set(userId, newBalance);
  console.log({ newBalance, userId });
  return newBalance;
}

function deductCredits(userId, credits) {
  const currentCredits = userCredits.get(userId) || 0;
  userCredits.set(userId, Math.max(0, currentCredits - credits));
}

// User management APIs
app.post("/users", (req, res) => {
  const { name } = req.body;
  const id = Date.now().toString();
  const newUser = { id, name };
  users.set(id, newUser);
  userCredits.set(id, 100); // Give new users 100 credits
  res.status(201).json(newUser);
});

app.get("/users", (req, res) => {
  res.json(Array.from(users.values()));
});

app.get("/users/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Credit management APIs
app.post("/add-credits", (req, res) => {
  const { userId, credits } = req.body;
  const newBalance = addCredits(userId, credits);
  res.json({ success: true, newBalance });
});

app.get("/check-credits/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({ credits: userCredits.get(userId) || 0 });
});

// Call history API (simplified, just returns active calls)
app.get("/call-history/:userId", (req, res) => {
  const { userId } = req.params;
  const userCall = Array.from(activeCalls.entries()).find(
    ([callerId, call]) => callerId === userId || call.calleeId === userId
  );

  if (userCall) {
    const [callerId, call] = userCall;
    res.json({
      ongoing: true,
      callerId,
      calleeId: call.calleeId,
      startTime: call.startTime,
    });
  } else {
    res.json({ ongoing: false });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
