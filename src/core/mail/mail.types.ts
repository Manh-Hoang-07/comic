/**
 * Options for sending a single email.
 */
export interface SendMailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

/**
 * A single item inside a bulk-send request.
 */
export interface BulkMailItem {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

/**
 * Options for sending multiple emails at once.
 */
export interface BulkMailOptions {
    emails: BulkMailItem[];
    /** Send in parallel (default) or sequentially. */
    parallel?: boolean;
}

export interface BulkMailResult {
    success: number;
    failed: number;
    errors: Array<{ index: number; email: string; error: string }>;
}
