// src/db.js
// MongoDB connection module - connects once and exports getDb() for all routes

const { MongoClient } = require('mongodb');

let db;

/**
 * Connect to MongoDB Atlas and store the database instance
 */
async function connectDb() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('taskmanager');
  console.log('✓ MongoDB connected');
}

/**
 * Get the database instance
 * @returns {Db} MongoDB database instance
 */
function getDb() {
  if (!db) throw new Error('DB not initialised — call connectDb() first');
  return db;
}

module.exports = { connectDb, getDb };
