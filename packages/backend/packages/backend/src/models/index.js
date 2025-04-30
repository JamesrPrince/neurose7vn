const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Project = require('./project.model');
const Message = require('./message.model');
const Review = require('./review.model');

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Initialize models (already done in individual files)
const models = {
  User,
  Project,
  Message,
  Review,
  sequelize
};

// Sync all models with database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`All models were synchronized ${force ? 'with force' : 'successfully'}.`);
    return true;
  } catch (error) {
    console.error('Error synchronizing models with database:', error);
    return false;
  }
};

// Additional relationship logic could be added here if needed
// (Most relationships are already defined in individual model files)

// Add an "associate" function for future association setup if needed
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  ...models,
  testConnection,
  syncDatabase
};

