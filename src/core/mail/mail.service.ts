import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { CacheService } from '@/common/cache/services';
import {
  IEmailConfigRepository,
  EMAIL_CONFIG_REPOSITORY,
} from '@/modules/core/system-config/email/domain/repositories/email-config.repository';
import {
  SendMailOptions,
  BulkMailItem,
  BulkMailOptions,
  BulkMailResult,
} from './mail.types';
import { buildTransporter, buildMailPayload } from './mail-transporter.helper';

const MAIL_CONFIG_CACHE_KEY = 'mail:active-config';
const MAIL_CONFIG_CACHE_TTL = 600; // 10 minutes

@Injectable()
export class MailService {
  private transporterCache: Transporter | null = null;
  private configCache: any | null = null;

  constructor(
    @Inject(EMAIL_CONFIG_REPOSITORY)
    private readonly emailConfigRepo: IEmailConfigRepository,
    private readonly cacheService: CacheService,
  ) { }

  // ── Config & Transporter ──────────────────────────────────────────────────

  private async loadActiveConfig(): Promise<any> {
    return this.cacheService.getOrSet<any>(
      MAIL_CONFIG_CACHE_KEY,
      async () => {
        const config = await this.emailConfigRepo.getConfig();
        if (!config) {
          throw new InternalServerErrorException(
            'Email configuration not found. Please configure email in system config.',
          );
        }
        return config;
      },
      MAIL_CONFIG_CACHE_TTL,
    );
  }

  private async getActiveConfig(): Promise<any> {
    if (!this.configCache) {
      this.configCache = await this.loadActiveConfig();
    }
    return this.configCache;
  }

  private async getTransporter(): Promise<Transporter> {
    if (!this.transporterCache) {
      const config = await this.getActiveConfig();
      this.transporterCache = buildTransporter(config);
    }
    return this.transporterCache;
  }

  /**
   * Invalidate cached config and transporter.
   * Call this whenever the email configuration is changed.
   */
  async clearConfigCache(): Promise<void> {
    await this.cacheService.del(MAIL_CONFIG_CACHE_KEY);
    this.configCache = null;
    this.transporterCache = null;
  }

  // ── Public Send API ───────────────────────────────────────────────────────

  /** Send a single email. */
  async send(options: SendMailOptions): Promise<void> {
    this.validateEmailContent(options);
    const config = await this.getActiveConfig();
    const transporter = await this.getTransporter();
    await transporter.sendMail(buildMailPayload(config, options));
  }

  /**
   * Send multiple emails in parallel (default) or sequentially.
   * Returns a result summary with success/failure counts.
   */
  async sendBulk(options: BulkMailOptions): Promise<BulkMailResult> {
    if (!options.emails?.length) {
      throw new InternalServerErrorException('Email list cannot be empty.');
    }
    this.validateBulkEmailContents(options.emails);

    const config = await this.getActiveConfig();
    const transporter = await this.getTransporter();
    const parallel = options.parallel !== false;

    return parallel
      ? this.sendParallel(transporter, config, options.emails)
      : this.sendSequential(transporter, config, options.emails);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────


  private validateEmailContent(options: { html?: string; text?: string }): void {
    if (!options.html && !options.text) {
      throw new InternalServerErrorException(
        'Either html or text content must be provided when sending email.',
      );
    }
  }

  private validateBulkEmailContents(emails: BulkMailItem[]): void {
    emails.forEach((email, i) => {
      if (!email.html && !email.text) {
        throw new InternalServerErrorException(
          `Email at index ${i} must have either html or text content.`,
        );
      }
    });
  }

  private async sendParallel(
    transporter: Transporter,
    config: any,
    emails: BulkMailItem[],
  ): Promise<BulkMailResult> {
    const results = await Promise.allSettled(
      emails.map((email, index) =>
        transporter.sendMail(buildMailPayload(config, email)).then(
          () => ({ index, success: true }),
          (error) => ({ index, email: toAddrString(email.to), error }),
        ),
      ),
    );
    return aggregateResults(results);
  }

  private async sendSequential(
    transporter: Transporter,
    config: any,
    emails: BulkMailItem[],
  ): Promise<BulkMailResult> {
    const result: BulkMailResult = { success: 0, failed: 0, errors: [] };
    for (let i = 0; i < emails.length; i++) {
      try {
        await transporter.sendMail(buildMailPayload(config, emails[i]));
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          email: toAddrString(emails[i].to),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return result;
  }
}

// ── Module-level helpers ──────────────────────────────────────────────────────

function toAddrString(to: string | string[]): string {
  return Array.isArray(to) ? to.join(', ') : to;
}

function aggregateResults(
  settled: PromiseSettledResult<any>[],
): BulkMailResult {
  const result: BulkMailResult = { success: 0, failed: 0, errors: [] };
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      if (s.value?.success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push({
          index: s.value.index,
          email: s.value.email,
          error:
            s.value.error instanceof Error
              ? s.value.error.message
              : String(s.value.error),
        });
      }
    } else {
      result.failed++;
    }
  }
  return result;
}
