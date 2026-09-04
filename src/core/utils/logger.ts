import * as winston from 'winston';
import config from 'config';

// Get logging configuration
const logLevel = config.has('logging.level') ? config.get<string>('logging.level') : 'info';
const logFile = config.has('logging.file') ? config.get<string>('logging.file') : './logs/test-execution.log';
const logToConsole = config.has('logging.console') ? config.get<boolean>('logging.console') : true;

// Create log directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure winston logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'test-automation' },
  transports: [
    new winston.transports.File({ filename: logFile })
  ]
});

// Add console transport if enabled
if (logToConsole) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(info => {
        return `${info.timestamp} ${info.level}: ${info.message}`;
      })
    )
  }));
}

export { logger };
