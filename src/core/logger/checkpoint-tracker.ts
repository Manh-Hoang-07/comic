import { performance } from 'perf_hooks';

/**
 * Tracks named checkpoints with relative elapsed time from creation.
 * Useful for measuring step timings within a single operation.
 *
 * @example
 * ```typescript
 * const tracker = new CheckpointTracker();
 * // ... do some work ...
 * tracker.addCheckpoint('db_query');
 * // ... more work ...
 * tracker.addCheckpoint('transform');
 * logger.log('Done', { extra: { timings: tracker.toLogDetails() } });
 * ```
 */
export class CheckpointTracker {
    private readonly startTimeMs: number;
    private readonly checkpoints: Record<string, number> = {};

    constructor() {
        this.startTimeMs = performance.now();
    }

    /** Record the elapsed ms at the current moment under the given key. */
    addCheckpoint(key: string): void {
        const now = performance.now();
        this.checkpoints[key] = Math.round(now - this.startTimeMs);
    }

    /** Return a copy of all recorded checkpoints (key → elapsed ms). */
    toLogDetails(): Record<string, number> {
        return { ...this.checkpoints };
    }
}
