/**
 * Logging Utility
 * 
 * Centralized logging with environment-based log levels.
 * Prevents sensitive data from being logged in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel: LogLevel = 
  process.env.NODE_ENV === 'production' ? 'error' : 'debug'

/**
 * Check if a log level should be displayed
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel]
}

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization']
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Logger class for structured logging
 */
class Logger {
  private context?: string

  constructor(context?: string) {
    this.context = context
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const context = this.context ? `[${this.context}]` : ''
    return `${context} ${message}`
  }

  debug(message: string, data?: unknown): void {
    if (!shouldLog('debug')) return
    const formatted = this.formatMessage('debug', message)
    if (data !== undefined) {
      console.debug(formatted, sanitizeData(data))
    } else {
      console.debug(formatted)
    }
  }

  info(message: string, data?: unknown): void {
    if (!shouldLog('info')) return
    const formatted = this.formatMessage('info', message)
    if (data !== undefined) {
      console.info(formatted, sanitizeData(data))
    } else {
      console.info(formatted)
    }
  }

  warn(message: string, data?: unknown): void {
    if (!shouldLog('warn')) return
    const formatted = this.formatMessage('warn', message)
    if (data !== undefined) {
      console.warn(formatted, sanitizeData(data))
    } else {
      console.warn(formatted)
    }
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    if (!shouldLog('error')) return
    const formatted = this.formatMessage('error', message)
    
    if (error instanceof Error) {
      const errorData = data ? sanitizeData(data) : {}
      const errorObj: Record<string, unknown> = {
        stack: error.stack,
      }
      if (errorData && typeof errorData === 'object') {
        Object.assign(errorObj, errorData)
      }
      console.error(formatted, error.message, errorObj)
    } else if (error !== undefined) {
      console.error(formatted, sanitizeData(error), data ? sanitizeData(data) : '')
    } else {
      console.error(formatted, data ? sanitizeData(data) : '')
    }
  }
}

// Default logger instance
export const logger = new Logger()

// Create logger with context
export function createLogger(context: string): Logger {
  return new Logger(context)
}

// Export Logger class for custom instances
export { Logger }
