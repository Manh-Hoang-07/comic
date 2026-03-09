import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { RequestContext } from '@/common/shared/utils';
import { Auth } from '@/common/auth/utils';
import { DateUtil } from '@/core/utils/date.util';
import { LogContext } from './interfaces/log-context.interface';
import { LogWriteOptions } from './interfaces/log-write-options.interface';
import { CheckpointTracker } from './checkpoint-tracker';

export { LogWriteOptions } from './interfaces/log-write-options.interface';
export { CheckpointTracker } from './checkpoint-tracker';

// ─── Noise Filter ────────────────────────────────────────────────────────────

const SKIP_PATTERNS = [
  'Module dependencies initialized',
  'Mapped {',
  'Controller {',
  'Starting Nest application',
  'Nest application successfully started',
  'TokenBlacklistService destroyed',
  'TokenBlacklistService initialized',
  'Timezone set to',
];

function shouldSkipMessage(message: any): boolean {
  if (typeof message !== 'string') return false;
  return SKIP_PATTERNS.some((p) => message.includes(p));
}

// ─── Entry Builder ────────────────────────────────────────────────────────────

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

/** Recursively remove null/undefined values and empty objects. */
function removeEmpty(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.length > 0 ? obj : undefined;
  }

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

// ─── File Writer ──────────────────────────────────────────────────────────────

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function appendLine(filePath: string, line: string): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, line + '\n', { encoding: 'utf8' });
}

function writeEntryToFiles(
  logDir: string,
  level: LogLevel,
  entry: any,
  options?: LogWriteOptions,
): void {
  const line = JSON.stringify(entry);

  // Custom absolute path: write only there
  if (options?.filePath) {
    appendLine(options.filePath, line);
    return;
  }

  const date = DateUtil.formatDate(undefined, 'Y-m-d');
  const dailyDir = path.join(logDir, date);
  ensureDir(dailyDir);

  // Optional named file (e.g. 'api-requests')
  if (options?.fileBaseName) {
    appendLine(path.join(dailyDir, `${options.fileBaseName}.log`), line);
  }

  // Per-level file + combined app file
  appendLine(path.join(dailyDir, `${level}.log`), line);
  appendLine(path.join(dailyDir, 'app.log'), line);
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logDirectory: string;
  private readonly timezone: string;
  private static _instance: CustomLoggerService | undefined;

  constructor(private readonly configService: ConfigService) {
    this.logDirectory = this.configService.get('LOG_DIR') || './logs';
    this.timezone =
      this.configService.get('app.timezone') ||
      process.env.APP_TIMEZONE ||
      'Asia/Ho_Chi_Minh';
    ensureDir(this.logDirectory);
    CustomLoggerService._instance = this;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  log(message: any, context?: LogContext, options?: LogWriteOptions): void {
    if (shouldSkipMessage(message)) return;
    const entry = buildLogEntry('log', message, this.buildContext(context));
    writeEntryToFiles(this.logDirectory, 'log', entry, options);
  }

  error(
    message: any,
    trace?: string,
    context?: LogContext,
    options?: LogWriteOptions,
  ): void {
    const ctx = { ...this.buildContext(context), trace };
    const entry = buildLogEntry('error', message, ctx);
    const errInfo = extractErrorInfo(message, trace);
    if (errInfo) {
      entry.extra = { ...(entry.extra || {}), error: errInfo };
    }
    writeEntryToFiles(this.logDirectory, 'error', entry, options);
  }

  warn(message: any, context?: LogContext, options?: LogWriteOptions): void {
    const entry = buildLogEntry('warn', message, this.buildContext(context));
    writeEntryToFiles(this.logDirectory, 'warn', entry, options);
  }

  /**
   * Generic write with explicit level selection.
   * Useful when the caller wants a single entry point.
   */
  write(
    level: LogLevel,
    message: any,
    context?: LogContext,
    options?: LogWriteOptions,
  ): void {
    if (level === 'log' && shouldSkipMessage(message)) return;
    const entry = buildLogEntry(level, message, this.buildContext(context));
    writeEntryToFiles(this.logDirectory, level, entry, options);
  }

  /** Create a new checkpoint tracker to measure step timings. */
  createTracker(): CheckpointTracker {
    return new CheckpointTracker();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

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

  // ── Static helpers (allow logging without DI) ─────────────────────────────

  static instance(): CustomLoggerService | undefined {
    return CustomLoggerService._instance;
  }

  /**
   * Quick static write for use outside DI context.
   * Level defaults to 'log'; message is taken from extra.message if present.
   */
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
