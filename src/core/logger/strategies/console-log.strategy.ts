import { Injectable, LogLevel } from '@nestjs/common';
import { ILogStrategy } from '../interfaces/log-strategy.interface';

@Injectable()
export class ConsoleLogStrategy implements ILogStrategy {
  write(level: LogLevel, entry: any): void {
    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}
