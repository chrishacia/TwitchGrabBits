type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env?.DEV ?? true;

export class Logger {
  constructor(private readonly scope: string) {}

  private log(level: LogLevel, message: string, context?: unknown) {
    if (!isDev && level === 'debug') {
      return;
    }

    const payload = context ? [message, context] : [message];
    const prefix = `[TwitchGrabBits:${this.scope}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, ...payload);
        break;
      case 'info':
        console.info(prefix, ...payload);
        break;
      case 'warn':
        console.warn(prefix, ...payload);
        break;
      case 'error':
        console.error(prefix, ...payload);
        break;
      default:
        break;
    }
  }

  debug(message: string, context?: unknown) {
    this.log('debug', message, context);
  }

  info(message: string, context?: unknown) {
    this.log('info', message, context);
  }

  warn(message: string, context?: unknown) {
    this.log('warn', message, context);
  }

  error(message: string, context?: unknown) {
    this.log('error', message, context);
  }
}
