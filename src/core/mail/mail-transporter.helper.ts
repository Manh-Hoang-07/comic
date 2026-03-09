import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/** Raw SMTP config record (as stored in the database). */
interface SmtpConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    smtp_username?: string;
    smtp_password?: string;
    from_name: string;
    from_email: string;
    reply_to_email?: string;
}

/**
 * Build a nodemailer Transporter from the given SMTP config.
 * Covers common scenarios: authenticated SMTP, STARTTLS on port 587,
 * and local mail servers without TLS.
 */
export function buildTransporter(config: SmtpConfig): Transporter {
    const transportOptions: any = {
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        pool: true, // Connection pooling for performance
    };

    const hasAuth =
        config.smtp_username?.trim() && config.smtp_password?.trim();

    if (hasAuth) {
        transportOptions.auth = {
            user: config.smtp_username,
            pass: config.smtp_password,
        };
    }

    // Port 587 without SSL → require STARTTLS
    if (config.smtp_port === 587 && !config.smtp_secure) {
        transportOptions.requireTLS = true;
        transportOptions.tls = { rejectUnauthorized: false };
    }

    // Local server: relax TLS requirements
    const isLocalhost =
        config.smtp_host === 'localhost' || config.smtp_host === '127.0.0.1';
    if (isLocalhost) {
        transportOptions.tls = { rejectUnauthorized: false };
        if (!hasAuth) {
            transportOptions.ignoreTLS = true;
        }
    }

    return nodemailer.createTransport(transportOptions);
}

/**
 * Build the nodemailer `sendMail` payload from a config record and recipients.
 */
export function buildMailPayload(
    config: SmtpConfig,
    options: {
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        cc?: string | string[];
        bcc?: string | string[];
    },
): nodemailer.SendMailOptions {
    return {
        from: `"${config.from_name}" <${config.from_email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: config.reply_to_email || undefined,
    };
}
