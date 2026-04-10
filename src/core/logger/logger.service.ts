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

/** Nest `LoggerService` passes `context` as a string (class name), not LogContext. */
function normalizeNestLogContext(optionalParams: any[]): {
  context?: LogContext;
  options?: LogWriteOptions;
} {
  const filtered = optionalParams.filter((x) => x !== undefined);
  if (!filtered.length) return {};
  const last = filtered[filtered.length - 1];
  let options: LogWriteOptions | undefined;
  let rest = filtered;
  if (last && typeof last === 'object' && ('filePath' in last || 'fileBaseName' in last)) {
    options = last as LogWriteOptions;
    rest = filtered.slice(0, -1);
  }
  const first = rest[0];
  if (typeof first === 'string') {
    return { context: { context: first }, options };
  }
  if (first && typeof first === 'object') {
    return { context: first as LogContext, options };
  }
  return { options };
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

  // ── Public API (Nest LoggerService: variadic optional params) ──────────────

  log(message: any, ...optionalParams: any[]): void {
    if (shouldSkipMessage(message)) return;
    const { context: nestCtx, options } = normalizeNestLogContext(optionalParams);
    const entry = buildLogEntry('log', message, this.buildContext(nestCtx));
    writeEntryToFiles(this.logDirectory, 'log', entry, options);
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

    const { context: nestCtx, options } = normalizeNestLogContext(contextParams);
    const ctx = { ...this.buildContext(nestCtx), trace };
    const entry = buildLogEntry('error', message, ctx);
    const errInfo = extractErrorInfo(message, trace);
    if (errInfo) {
      entry.extra = { ...(entry.extra || {}), error: errInfo };
    }
    writeEntryToFiles(this.logDirectory, 'error', entry, options);
  }

  warn(message: any, ...optionalParams: any[]): void {
    const { context: nestCtx, options } = normalizeNestLogContext(optionalParams);
    const entry = buildLogEntry('warn', message, this.buildContext(nestCtx));
    writeEntryToFiles(this.logDirectory, 'warn', entry, options);
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
