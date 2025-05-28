const http = require("http");
const socketio = require("socket.io");
const app = require("./app");
const { connectDB } = require("./config/db");
const { handleSocketConnection } = require("./sockets/ticket.socket");
const { slaTrackerJob } = require("./cron/slaTracker.cron");
require("dotenv").config();
const cors = require("cors");
const { handleNotificationSockets } = require("./sockets/notification.socket");
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: FRONTEND,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.ioInstance = io;

// Connect MongoDB
connectDB();

// Start Cron Jobs
slaTrackerJob();
app.set("io", io); // Set io instance in app for use in routes

// Initialize Socket.IO
handleSocketConnection(io);
handleNotificationSockets(io);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => console.log(`🚀 Server running on port http://${HOST}:${PORT}`));
