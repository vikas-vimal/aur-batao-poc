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

const ALLOWED_ORIGIN =
  process.env.NODE_ENV !== "development"
    ? "https://aur-batao-poc.netlify.app"
    : "*";
console.log("ALLOWED_ORIGIN", ALLOWED_ORIGIN, process.env.NODE_ENV);

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
  },
});

const userIdToSocketIdMap = new Map();

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
  })
);

app.use((req, res, next) => {
  console.log(
    `------ ${req.method} ${req.url} (${
      req.body ? JSON.stringify(req.body) : ""
    })`
  );
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello..." });
});

app.get("/users-list", (req, res) => {
  res.status(200).json(Array.from(UsersDB.values()));
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);
});

server.listen(6080, () => {
  console.log("Express app listening on port 6080");
});
