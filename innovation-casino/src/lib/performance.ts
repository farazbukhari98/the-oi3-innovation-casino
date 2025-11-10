/**
 * Performance optimization utilities for handling high concurrent load
 * These utilities help manage 100+ simultaneous participants
 */

/**
 * Creates a debounced version of a function that delays invoking func until after
 * wait milliseconds have elapsed since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // Clear existing timeout if function is called again
    if (timeout) {
      clearTimeout(timeout);
    }

    // Set new timeout
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Creates a throttled version of a function that only invokes func at most once
 * per every wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Simple in-memory cache with TTL (Time To Live)
 * Used to reduce redundant Firebase reads
 */
export class CacheManager<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 2) {
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get cached data if it exists and is still valid
   */
  get(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache with current timestamp
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific key or entire cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if valid cache exists for key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Batch processor for write operations
 * Collects multiple operations and executes them together
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly processFn: (items: T[]) => Promise<void>;

  constructor(
    processFn: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    batchDelayMs: number = 500
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelayMs;
  }

  /**
   * Add item to batch for processing
   */
  add(item: T): void {
    this.batch.push(item);

    // Process immediately if batch is full
    if (this.batch.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Otherwise, set timer to process batch after delay
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  /**
   * Process all items in the batch immediately
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const items = [...this.batch];
    this.batch = [];

    try {
      await this.processFn(items);
    } catch (error) {
      console.error('Batch processing failed:', error);
      // Consider re-adding items to batch or handling error appropriately
    }
  }
}

/**
 * Queue manager with rate limiting
 * Ensures operations are processed at a controlled rate
 * Supports returning results from the process function
 */
export class QueueManager<T, R = void> {
  private queue: Array<{
    item: T;
    callback: (error?: Error, result?: R) => void
  }> = [];
  private processing = false;
  private readonly processDelay: number;
  private readonly processFn: (item: T) => Promise<R>;

  constructor(
    processFn: (item: T) => Promise<R>,
    processDelayMs: number = 100
  ) {
    this.processFn = processFn;
    this.processDelay = processDelayMs;
  }

  /**
   * Add item to queue for processing
   * Returns a promise that resolves with the result
   */
  enqueue(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        item,
        callback: (error, result) => {
          if (error) reject(error);
          else resolve(result as R);
        },
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process items in queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { item, callback } = this.queue.shift()!;

    try {
      const result = await this.processFn(item);
      callback(undefined, result);
    } catch (error) {
      callback(error as Error);
    }

    // Wait before processing next item (rate limiting)
    setTimeout(() => this.processQueue(), this.processDelay);
  }

  /**
   * Get current queue size
   */
  get size(): number {
    return this.queue.length;
  }
}