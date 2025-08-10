const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import routes and middleware
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const miningRoutes = require('./routes/mining');
const statsRoutes = require('./routes/stats');
const enginesRoutes = require('./routes/engines');
const tokenRoutes = require('./routes/token');
const researchRoutes = require('./routes/research');
const walletRoutes = require('./routes/wallet');
const stakingRoutes = require('./routes/staking');
const contractRoutes = require('./routes/contract');
const explorerRoutes = require('./routes/explorer');
const validatorsRoutes = require('./routes/validators');

// Import database connection
const { connectDB, query } = require('./database/connection');
const { connectRedis, get, set } = require('./database/redis');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware, optionalAuthMiddleware } = require('./middleware/auth');

// Initialize express app
const app = express();
const server = createServer(app);

// Respect X-Forwarded-* headers when behind ALB/CloudFront
app.set('trust proxy', 1);

// Build allowed CORS origins
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3002'
];
const envOrigins = [];
if (process.env.FRONTEND_URL) envOrigins.push(process.env.FRONTEND_URL);
if (process.env.CLOUDFRONT_DOMAIN) envOrigins.push(`https://${process.env.CLOUDFRONT_DOMAIN}`);
if (process.env.S3_WEBSITE_URL) envOrigins.push(process.env.S3_WEBSITE_URL);
if (process.env.CORS_ALLOWED_ORIGINS) {
  envOrigins.push(
    ...process.env.CORS_ALLOWED_ORIGINS
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  );
}
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'productiveminer-backend' },
  transports: [
    new winston.transports.File({ filename: '/app/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/app/logs/combined.log' })
  ]
});

// Always add console logging for development and debugging
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Very high limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // 15 minutes in minutes
    });
  }
});

// Request counter for debugging
let requestCount = 0;
const requestCounter = (req, res, next) => {
  requestCount++;
  if (requestCount % 100 === 0) {
    logger.info(`Total requests processed: ${requestCount}`);
  }
  next();
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin} not in allowed origins`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestCounter);
// Apply rate limiter globally but relax for wallet info to reduce 429s in UI
app.use((req, res, next) => {
  if (req.path.startsWith('/api/wallet/info')) {
    return next();
  }
  return limiter(req, res, next);
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/stats', optionalAuthMiddleware, statsRoutes);
app.use('/api/engines', enginesRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/wallet', optionalAuthMiddleware, walletRoutes);
app.use('/api/staking', optionalAuthMiddleware, stakingRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/validators', validatorsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-mining-session', (data) => {
    socket.join(`mining-session-${data.sessionId}`);
    logger.info(`Client ${socket.id} joined mining session ${data.sessionId}`);
  });
  
  socket.on('mining-update', (data) => {
    socket.to(`mining-session-${data.sessionId}`).emit('mining-progress', data);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Database connection and server startup
async function startServer() {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  
  // Start the HTTP server first
  server.listen(PORT, HOST, () => {
    logger.info(`Server running on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });

  // Try to connect to databases in the background
  try {
    // Connect to PostgreSQL
    await connectDB();
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database:', error);
    // Don't exit, continue without database
  }

  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis cache');
  } catch (error) {
    logger.error('Failed to connect to Redis cache:', error);
    // Don't exit, continue without Redis
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on 0.0.0.0:${PORT}`, { service: 'productiveminer-backend' });
});

// Background process to auto-confirm blocks
async function autoConfirmBlocks() {
  try {
    const result = await query(`
      SELECT block_number, block_hash, miner_address, block_reward, auto_confirm_at
      FROM blocks 
      WHERE status = 'pending' 
      AND auto_confirm_at IS NOT NULL 
      AND auto_confirm_at <= NOW()
      ORDER BY block_number ASC
    `);
    
    if (result.rows.length > 0) {
      logger.info(`Found ${result.rows.length} blocks ready for auto-confirmation`);
      
      for (const block of result.rows) {
        try {
          // Update block status to confirmed
          await query(
            `UPDATE blocks SET status = 'confirmed', transactions_count = 1 WHERE block_number = $1`,
            [block.block_number]
          );
          
          // Create mining reward transaction
          const txHash = '0x' + require('crypto').randomBytes(32).toString('hex');
          await query(
            `INSERT INTO transactions (tx_hash, block_number, from_address, to_address, value, status, transaction_type, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              txHash, 
              block.block_number, 
              '0x0000000000000000000000000000000000000000', 
              block.miner_address, 
              block.block_reward, 
              'confirmed', 
              'mining_reward'
            ]
          );
          
          // Update mining session to completed
          await query(
            `UPDATE mining_sessions 
             SET status = 'completed', end_time = NOW(), duration = EXTRACT(EPOCH FROM (NOW() - start_time)), coins_earned = $1
             WHERE block_number = $2`,
            [block.block_reward, block.block_number]
          );
          
          // Update Redis cache with confirmed block
          try {
            const confirmedBlock = {
              block_number: block.block_number,
              block_hash: block.block_hash,
              miner_address: block.miner_address,
              timestamp: Date.now(),
              transactions_count: 1,
              block_reward: block.block_reward,
              status: 'confirmed'
            };
            const existing = (await get('recent_blocks')) || [];
            const updated = [confirmedBlock, ...existing].slice(0, 50);
            await set('recent_blocks', updated, 3600);
          } catch (e) {
            logger.warn('Failed to update recent_blocks in Redis', { error: e.message });
          }
          
          logger.info('Block auto-confirmed successfully', { 
            blockNumber: block.block_number,
            reward: block.block_reward
          });
          
        } catch (error) {
          logger.error('Error auto-confirming block', { error: error.message, blockNumber: block.block_number });
        }
      }
    }
  } catch (error) {
    logger.error('Error in auto-confirm blocks process', { error: error.message });
  }
}

// Run auto-confirmation every 10 seconds
setInterval(autoConfirmBlocks, 10000);

// Run initial check
setTimeout(autoConfirmBlocks, 5000);
