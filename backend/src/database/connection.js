const { Pool } = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/database.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Create connection pool with better error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Allow self-signed certificates for RDS
  } : false, // Disable SSL for local development
  // Add retry logic
  retryDelay: 1000,
  maxRetries: 3
});

// Test the connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Connect to database
async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

// Execute query with error handling
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error:', { text, error: error.message });
    throw error;
  }
}

// Get client for transactions
async function getClient() {
  return await pool.connect();
}

// Check if database is available
async function isDatabaseAvailable() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.warn('Database not available:', error.message);
    return false;
  }
}

// Safe query function that returns fallback data if database is unavailable
async function safeQuery(text, params, fallbackData = null) {
  try {
    const result = await query(text, params);
    return result;
  } catch (error) {
    logger.warn('Database query failed, using fallback data:', error.message);
    return fallbackData;
  }
}

module.exports = {
  connectDB,
  query,
  getClient,
  pool,
  isDatabaseAvailable,
  safeQuery
};
