import { LogLevel } from '@nestjs/common';
import { LogWriteOptions } from '../interfaces/log-write-options.interface';

export interface ILogStrategy {
  write(
    level: LogLevel,
    entry: any,
    options?: LogWriteOptions,
  ): Promise<void> | void;
}
