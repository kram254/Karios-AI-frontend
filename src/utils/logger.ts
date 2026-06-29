type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    const isDev = import.meta.env.DEV;
    this.config = {
      enabled: isDev,
      level: isDev ? 'debug' : 'warn',
      showTimestamp: false,
      prefix: '',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];
    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }
    parts.push(message);
    return parts.join(' ');
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

export const workflowLogger = new Logger({ prefix: 'Workflow' });
export const chatLogger = new Logger({ prefix: 'Chat' });
export const wsLogger = new Logger({ prefix: 'WebSocket' });

export const createLogger = (prefix: string) => new Logger({ prefix });

export const disableAllLogs = () => {
  workflowLogger.setEnabled(false);
  chatLogger.setEnabled(false);
  wsLogger.setEnabled(false);
};

export const enableAllLogs = () => {
  workflowLogger.setEnabled(true);
  chatLogger.setEnabled(true);
  wsLogger.setEnabled(true);
};

if (typeof window !== 'undefined') {
  (window as any).enableLogs = enableAllLogs;
  (window as any).disableLogs = disableAllLogs;
}

export default Logger;
