/**
 * Options for writing log to a specific file location.
 */
export interface LogWriteOptions {
    /** Absolute or relative file path. If provided, write to this exact file. */
    filePath?: string;
    /** Custom base name; final file becomes <base>.<YYYY-MM-DD>.log if filePath is not provided */
    fileBaseName?: string;
}
