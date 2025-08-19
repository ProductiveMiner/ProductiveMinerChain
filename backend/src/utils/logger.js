const winston = require('winston');
const path = require('path');

// Use relative path for logs in development, absolute path in production
const logDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

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
    new winston.transports.File({ filename: errorLogPath, level: 'error' }),
    new winston.transports.File({ filename: combinedLogPath })
  ]
});

// Always add console logging for development and debugging
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

module.exports = logger;
