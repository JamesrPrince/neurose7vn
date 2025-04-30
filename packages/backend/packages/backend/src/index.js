/**
 * TechFreelance Marketplace Backend
 * Main server entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(__dirname, `../../.env.${environment}`)
});

// Import database models and test connection
const { testConnection } = require('./models');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
let server; // Declare server in the outer scope so it can be accessed by shutdown handler

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan(environment === 'development' ? 'dev' : 'combined')); // HTTP request logging
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TechFreelance API is running',
    environment,
    timestamp: new Date()
  });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const messageRoutes = require('./routes/message.routes');
const reviewRoutes = require('./routes/review.routes');

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
// TODO: Add other API routes
// app.use('/api/users', userRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`Error ${statusCode}: ${message}`);
  if (environment === 'development') {
    console.error(err.stack);
  }
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: environment === 'development' ? err.stack : undefined
  });
});

// Prepare module exports
const moduleExports = { app };

// Connect to database and start the server
(async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Server will not start.');
      process.exit(1);
    }
    
    // Start the server
    server = app.listen(PORT, () => {
      console.log(`Server running in ${environment} mode on port ${PORT}`);
    });
    
    // Add server to exports
    moduleExports.server = server;
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();

// Export app and server for testing
module.exports = moduleExports;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      // Close database connections or any other cleanup
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

