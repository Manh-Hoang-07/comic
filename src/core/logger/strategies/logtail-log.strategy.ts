import { Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logtail } from '@logtail/node';
import { ILogStrategy } from '../interfaces/log-strategy.interface';

@Injectable()
export class LogtailLogStrategy implements ILogStrategy {
  private logtail: Logtail | null = null;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('LOGTAIL_TOKEN');
    if (token) {
      this.logtail = new Logtail(token);
    }
  }

  async write(level: LogLevel, entry: any): Promise<void> {
    if (!this.logtail) return;

    const { message, ...context } = entry;

    switch (level) {
      case 'error':
      case 'fatal':
        this.logtail.error(message, context);
        break;
      case 'warn':
        this.logtail.warn(message, context);
        break;
      case 'debug':
      case 'verbose':
        this.logtail.debug(message, context);
        break;
      default:
        this.logtail.info(message, context);
        break;
    }
  }
}
