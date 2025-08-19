const { Pool } = require('pg');
const winston = require('winston');
const path = require('path');

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const databaseLogPath = path.join(logDir, 'database.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: databaseLogPath })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Parse DATABASE_URL and handle special characters in password
function parseDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const url = new URL(databaseUrl);
    // Decode the password to handle special characters
    const decodedPassword = decodeURIComponent(url.password);
    
    return {
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.substring(1), // Remove leading slash
      user: url.username,
      password: decodedPassword,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    };
  } catch (error) {
    logger.error('Error parsing DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
}

// Create connection pool with better error handling
let pool;
try {
  // Use individual environment variables directly
  const dbConfig = {
    host: process.env.DB_HOST || 'productiveminer-aurora-cluster.cluster-c0lmo082cafp.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'productiveminer_db',
    user: process.env.DB_USER || 'productiveminer',
    password: process.env.DB_PASSWORD || 'ProductiveMiner_Aurora_1755531656_Secure!',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password ? '***' : 'undefined'
  });
  
  pool = new Pool(dbConfig);
} catch (error) {
  logger.error('Failed to create database pool:', error);
  // Create a fallback pool with individual environment variables
  pool = new Pool({
    host: process.env.DB_HOST || 'productiveminer-aurora-cluster.cluster-c0lmo082cafp.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'productiveminer_db',
    user: process.env.DB_USER || 'productiveminer',
    password: process.env.DB_PASSWORD || 'ProductiveMiner_Aurora_1755531656_Secure!',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Test the connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  // Don't exit process, just log the error
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    logger.error('Database connection failed - check if database is running');
  }
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
