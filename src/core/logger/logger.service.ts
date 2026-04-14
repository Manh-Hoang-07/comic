import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestContext } from '@/common/shared/utils';
import { Auth } from '@/common/auth/utils';
import { DateUtil } from '@/core/utils/date.util';
import { LogContext } from './interfaces/log-context.interface';
import { LogWriteOptions } from './interfaces/log-write-options.interface';
import { CheckpointTracker } from './checkpoint-tracker';
import { ILogStrategy } from './interfaces/log-strategy.interface';
import { ConsoleLogStrategy } from './strategies/console-log.strategy';
import { FileLogStrategy } from './strategies/file-log.strategy';
import { LogtailLogStrategy } from './strategies/logtail-log.strategy';

export { LogWriteOptions } from './interfaces/log-write-options.interface';
export { CheckpointTracker } from './checkpoint-tracker';

const SKIP_PATTERNS = [
  'Module dependencies initialized',
  'Mapped {',
  'Controller {',
  'Starting Nest application',
  'Nest application successfully started',
  'TokenBlacklistService destroyed',
  'TokenBlacklistService initialized',
  'Timezone set to',
  '[SQL]',
  '[PERF]',
  'Admin API Call:',
  'Outgoing Response',
  'Swagger is disabled',
];

function shouldSkipMessage(message: any): boolean {
  if (typeof message !== 'string') return false;
  return SKIP_PATTERNS.some((p) => message.includes(p));
}

function buildLogEntry(
  level: LogLevel,
  message: any,
  context: LogContext & { trace?: string },
): Record<string, any> {
  const raw = {
    timestamp: DateUtil.formatTimestamp(),
    level: level.toUpperCase(),
    message,
    context: context.context || 'Application',
    account: { userId: context.userId },
    api: {
      method: context.method,
      url: context.url,
      requestId: context.requestId,
    },
    device: {
      ip: context.ip,
      userAgent: context.userAgent,
    },
    trace: context.trace,
    extra: context.extra || {},
  };
  return removeEmpty(raw);
}

function extractErrorInfo(
  message: any,
  trace?: string,
): { errorMessage?: string; stackTrace?: string } | undefined {
  if (message instanceof Error) {
    return { errorMessage: message.message, stackTrace: message.stack };
  }
  if (trace) {
    return {
      errorMessage: typeof message === 'string' ? message : undefined,
      stackTrace: trace,
    };
  }
  return undefined;
}

function removeEmpty(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.length > 0 ? obj : undefined;

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) cleaned[key] = value;
      continue;
    }
    if (typeof value === 'object') {
      const nested = removeEmpty(value);
      if (nested && Object.keys(nested).length > 0) cleaned[key] = nested;
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

function normalizeNestLogContext(optionalParams: any[]): {
  context?: LogContext;
  options?: LogWriteOptions;
} {
  const filtered = optionalParams.filter((x) => x !== undefined);
  if (!filtered.length) return {};
  const last = filtered[filtered.length - 1];
  let options: LogWriteOptions | undefined;
  let rest = filtered;
  if (
    last &&
    typeof last === 'object' &&
    ('filePath' in last || 'fileBaseName' in last)
  ) {
    options = last as LogWriteOptions;
    rest = filtered.slice(0, -1);
  }
  const first = rest[0];
  if (typeof first === 'string')
    return { context: { context: first }, options };
  if (first && typeof first === 'object')
    return { context: first as LogContext, options };
  return { options };
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly strategies: ILogStrategy[] = [];
  private static _instance: CustomLoggerService | undefined;

  constructor(private readonly configService: ConfigService) {
    const drivers = this.configService.get<string>('LOG_DRIVERS') || 'console';
    const driverList = drivers.split(',').map((d) => d.trim().toLowerCase());

    // 1. Console strategy
    if (driverList.includes('console')) {
      this.strategies.push(new ConsoleLogStrategy());
    }

    // 2. File strategy
    if (driverList.includes('file')) {
      this.strategies.push(new FileLogStrategy(this.configService));
    }

    // 3. Logtail strategy
    if (
      driverList.includes('logtail') &&
      this.configService.get('LOGTAIL_TOKEN')
    ) {
      this.strategies.push(new LogtailLogStrategy(this.configService));
    }

    CustomLoggerService._instance = this;
  }

  private dispatch(
    level: LogLevel,
    entry: any,
    options?: LogWriteOptions,
  ): void {
    for (const strategy of this.strategies) {
      try {
        strategy.write(level, entry, options);
      } catch (e: any) {
        // Fallback console if strategy fails
        console.error(`Logger Strategy Error: ${e.message}`);
      }
    }
  }

  log(message: any, ...optionalParams: any[]): void {
    if (shouldSkipMessage(message)) return;
    const { context: nestCtx, options } =
      normalizeNestLogContext(optionalParams);
    const entry = buildLogEntry('log', message, this.buildContext(nestCtx));
    this.dispatch('log', entry, options);
  }

  error(message: any, ...optionalParams: any[]): void {
    const params = optionalParams.filter((x) => x !== undefined);
    let trace: string | undefined;
    let contextParams: any[] = params;

    if (params.length >= 2) {
      trace = typeof params[0] === 'string' ? params[0] : undefined;
      contextParams = params.slice(1);
    } else if (params.length === 1) {
      const p = params[0];
      if (typeof p === 'string' && (p.includes('\n') || p.includes('at '))) {
        trace = p;
        contextParams = [];
      } else {
        contextParams = [p];
      }
    }

    const { context: nestCtx, options } =
      normalizeNestLogContext(contextParams);
    const ctx = { ...this.buildContext(nestCtx), trace };
    const entry = buildLogEntry('error', message, ctx);
    const errInfo = extractErrorInfo(message, trace);
    if (errInfo) entry.extra = { ...(entry.extra || {}), error: errInfo };
    this.dispatch('error', entry, options);
  }

  warn(message: any, ...optionalParams: any[]): void {
    const { context: nestCtx, options } =
      normalizeNestLogContext(optionalParams);
    const entry = buildLogEntry('warn', message, this.buildContext(nestCtx));
    this.dispatch('warn', entry, options);
  }

  debug?(message: any, ...optionalParams: any[]): void {
    this.log(message, ...optionalParams);
  }

  verbose?(message: any, ...optionalParams: any[]): void {
    this.log(message, ...optionalParams);
  }

  fatal?(message: any, ...optionalParams: any[]): void {
    this.error(message, ...optionalParams);
  }

  write(
    level: LogLevel,
    message: any,
    context?: LogContext,
    options?: LogWriteOptions,
  ): void {
    if (level === 'log' && shouldSkipMessage(message)) return;
    const entry = buildLogEntry(level, message, this.buildContext(context));
    this.dispatch(level, entry, options);
  }

  createTracker(): CheckpointTracker {
    return new CheckpointTracker();
  }

  private buildContext(overrides?: LogContext): LogContext {
    return {
      context: 'Application',
      userId: Auth.id(),
      requestId: RequestContext.get('requestId') as string,
      method: RequestContext.get('method') as string,
      url: RequestContext.get('url') as string,
      ip: RequestContext.get('ip') as string,
      userAgent: RequestContext.get('userAgent') as string,
      ...overrides,
    };
  }

  static instance(): CustomLoggerService | undefined {
    return CustomLoggerService._instance;
  }

  static write(extra?: Record<string, any>, filePath?: string): void {
    const message =
      extra && typeof extra.message !== 'undefined' ? extra.message : 'LOG';
    const inst = CustomLoggerService._instance;
    if (inst) {
      inst.write(
        'log',
        message,
        extra ? { extra } : undefined,
        filePath ? { filePath } : undefined,
      );
    }
  }
}
