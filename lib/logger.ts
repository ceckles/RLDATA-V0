import { createClient } from "@/lib/supabase/server"

export type LogLevel = "debug" | "info" | "warn" | "error"
export type LogCategory = "auth" | "api" | "database" | "payment" | "user_action" | "system" | "analytics"

interface LogMetadata {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: LogMetadata
  error?: Error
  userId?: string
  userAgent?: string
  ipAddress?: string
  path?: string
}

class Logger {
  private async writeLog(entry: LogEntry) {
    try {
      const supabase = await createClient()

      // Prepare log data
      const logData = {
        user_id: entry.userId || null,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata || {},
        stack_trace: entry.error?.stack || null,
        user_agent: entry.userAgent || null,
        ip_address: entry.ipAddress || null,
        path: entry.path || null,
      }

      // Insert log into database
      const { error } = await supabase.from("logs").insert(logData)

      if (error) {
        // Fallback to console if database insert fails
        console.error("[Logger] Failed to write log to database:", error)
        this.consoleLog(entry)
      }
    } catch (error) {
      // Fallback to console if any error occurs
      console.error("[Logger] Error in writeLog:", error)
      this.consoleLog(entry)
    }
  }

  private consoleLog(entry: LogEntry) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case "debug":
        console.debug(message, entry.metadata || "")
        break
      case "info":
        console.info(message, entry.metadata || "")
        break
      case "warn":
        console.warn(message, entry.metadata || "")
        break
      case "error":
        console.error(message, entry.metadata || "", entry.error || "")
        break
    }
  }

  async debug(category: LogCategory, message: string, metadata?: LogMetadata) {
    await this.writeLog({ level: "debug", category, message, metadata })
  }

  async info(category: LogCategory, message: string, metadata?: LogMetadata) {
    await this.writeLog({ level: "info", category, message, metadata })
  }

  async warn(category: LogCategory, message: string, metadata?: LogMetadata) {
    await this.writeLog({ level: "warn", category, message, metadata })
  }

  async error(category: LogCategory, message: string, error?: Error, metadata?: LogMetadata) {
    await this.writeLog({ level: "error", category, message, error, metadata })
  }

  // Helper method to log with user context
  async logWithUser(
    userId: string,
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: LogMetadata,
    error?: Error,
  ) {
    await this.writeLog({ level, category, message, metadata, error, userId })
  }

  // Helper method to log with request context
  async logWithRequest(
    level: LogLevel,
    category: LogCategory,
    message: string,
    request: Request,
    metadata?: LogMetadata,
    error?: Error,
  ) {
    const userAgent = request.headers.get("user-agent") || undefined
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
    const path = new URL(request.url).pathname

    await this.writeLog({
      level,
      category,
      message,
      metadata,
      error,
      userAgent,
      ipAddress,
      path,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = (category: LogCategory, message: string, metadata?: LogMetadata) =>
  logger.debug(category, message, metadata)

export const logInfo = (category: LogCategory, message: string, metadata?: LogMetadata) =>
  logger.info(category, message, metadata)

export const logWarn = (category: LogCategory, message: string, metadata?: LogMetadata) =>
  logger.warn(category, message, metadata)

export const logError = (category: LogCategory, message: string, error?: Error, metadata?: LogMetadata) =>
  logger.error(category, message, error, metadata)
