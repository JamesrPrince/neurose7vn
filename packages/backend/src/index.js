const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const { testConnection } = require("./models");
const { initializeSocket } = require("./config/socket");
const { handleUploadError } = require("./config/upload");

// Load environment variables based on NODE_ENV
const environment = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(__dirname, `../.env.${environment}`),
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 4000;
let server;
let io;

// Apply middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving static files
  })
);
app.use(cors());
app.use(morgan(environment === "development" ? "dev" : "combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// File upload error handler
app.use(handleUploadError);

// API Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "TechFreelance API is running",
    environment,
    timestamp: new Date(),
  });
});

// Import routes
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const messageRoutes = require("./routes/message.routes");
const reviewRoutes = require("./routes/review.routes");

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`Error ${statusCode}: ${message}`);
  if (environment === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    stack: environment === "development" ? err.stack : undefined,
  });
});

// Connect to database and start the server
(async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error(
        "Failed to connect to the database. Server will not start."
      );
      process.exit(1);
    }

    // Start the HTTP server
    server = app.listen(PORT, () => {
      console.log(`HTTP server running in ${environment} mode on port ${PORT}`);
    });

    // Initialize Socket.IO
    io = initializeSocket(server);
    console.log(`WebSocket server initialized on port ${PORT}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = { app, server };
