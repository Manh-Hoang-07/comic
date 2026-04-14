import { Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DateUtil } from '@/core/utils/date.util';
import { ILogStrategy } from '../interfaces/log-strategy.interface';
import { LogWriteOptions } from '../interfaces/log-write-options.interface';

@Injectable()
export class FileLogStrategy implements ILogStrategy {
  private readonly logDirectory: string;

  constructor(private readonly configService: ConfigService) {
    this.logDirectory = this.configService.get('LOG_DIR') || './logs';
    this.ensureDir(this.logDirectory);
  }

  write(level: LogLevel, entry: any, options?: LogWriteOptions): void {
    const line = JSON.stringify(entry);

    // Custom absolute path: write only there
    if (options?.filePath) {
      this.appendLine(options.filePath, line);
      return;
    }

    const date = DateUtil.formatDate(undefined, 'Y-m-d');
    const dailyDir = path.join(this.logDirectory, date);
    this.ensureDir(dailyDir);

    // Optional named file (e.g. 'api-requests')
    if (options?.fileBaseName) {
      this.appendLine(path.join(dailyDir, `${options.fileBaseName}.log`), line);
    }

    // Per-level file + combined app file
    this.appendLine(path.join(dailyDir, `${level}.log`), line);
    this.appendLine(path.join(dailyDir, 'app.log'), line);
  }

  private ensureDir(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (_e) {
      // Ignore filesystem errors (e.g. read-only on Vercel)
    }
  }

  private appendLine(filePath: string, line: string): void {
    this.ensureDir(path.dirname(filePath));
    try {
      fs.appendFileSync(filePath, line + '\n', { encoding: 'utf8' });
    } catch (_e) {
      // Ignore
    }
  }
}
