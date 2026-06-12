import type { ConnectionOptions, Job, JobsOptions, Queue, Worker } from 'bullmq';
import debug from 'debug';

import { type HealthCheckResult, type QueueMessage, type QueueStats } from '../types';
import { type QueueServiceImpl } from './type';

const log = debug('queue:bullmq');

export type BullMQExecutionCallback = (
  operationId: string,
  stepIndex: number,
  context: QueueMessage['context'],
  payload?: QueueMessage['payload'],
) => Promise<void>;

const QUEUE_NAME = 'lobehub-agent-runtime';

const parseRedisUrl = (redisUrl: string): ConnectionOptions => {
  const parsed = new URL(redisUrl);
  return {
    db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : undefined,
    host: parsed.hostname,
    password: parsed.password || undefined,
    port: parsed.port ? Number(parsed.port) : 6379,
  };
};

const priorityWeight = (priority: QueueMessage['priority']): number => {
  switch (priority) {
    case 'high': {
      return 1;
    }
    case 'low': {
      return 10;
    }
    default: {
      return 5;
    }
  }
};

const parseRetryDelay = (retryDelay?: string): JobsOptions['backoff'] => {
  if (!retryDelay) return undefined;

  const fixedMs = Number(retryDelay);
  if (Number.isFinite(fixedMs) && fixedMs >= 0) {
    return { delay: fixedMs, type: 'fixed' };
  }

  return undefined;
};

export class BullMQQueueServiceImpl implements QueueServiceImpl {
  private connection: ConnectionOptions;
  private executionCallback: BullMQExecutionCallback | null = null;
  private queue: Queue<QueueMessage, string, string, QueueMessage> | null = null;
  private worker: Worker<QueueMessage, string, string> | null = null;

  constructor(config: { redisUrl: string }) {
    if (!config.redisUrl) {
      throw new Error('Redis URL is required for BullMQ queue service');
    }

    this.connection = parseRedisUrl(config.redisUrl);
  }

  setExecutionCallback(callback: BullMQExecutionCallback): void {
    this.executionCallback = callback;
    this.ensureWorker();
  }

  async scheduleMessage(message: QueueMessage): Promise<string> {
    const queue = await this.ensureQueue();
    const job = await queue.add(
      `${message.operationId}:${message.stepIndex}`,
      message,
      {
        attempts: Math.max(1, message.retries ?? 3),
        backoff: parseRetryDelay(message.retryDelay),
        delay: Math.max(0, message.delay ?? 0),
        priority: priorityWeight(message.priority),
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );

    log(
      '[%s] Scheduled BullMQ step %d (jobId: %s)',
      message.operationId,
      message.stepIndex,
      job.id,
    );

    return String(job.id);
  }

  async scheduleBatchMessages(messages: QueueMessage[]): Promise<string[]> {
    const queue = await this.ensureQueue();
    const jobs = messages.map((message) => ({
      data: message,
      name: `${message.operationId}:${message.stepIndex}`,
      opts: {
        attempts: Math.max(1, message.retries ?? 3),
        backoff: parseRetryDelay(message.retryDelay),
        delay: Math.max(0, message.delay ?? 0),
        priority: priorityWeight(message.priority),
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }));

    const created = await queue.addBulk(jobs);
    return created.map((job) => String(job.id));
  }

  async cancelScheduledTask(taskId: string): Promise<void> {
    const queue = await this.ensureQueue();
    const job = await queue.getJob(taskId);
    if (!job) return;
    await job.remove();
  }

  async getQueueStats(): Promise<QueueStats> {
    const queue = await this.ensureQueue();
    const counts = await queue.getJobCounts('completed', 'delayed', 'failed', 'waiting', 'active');

    return {
      completedCount: counts.completed ?? 0,
      failedCount: counts.failed ?? 0,
      pendingCount: (counts.waiting ?? 0) + (counts.delayed ?? 0),
      processingCount: counts.active ?? 0,
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const stats = await this.getQueueStats();
      return {
        healthy: true,
        message: `BullMQ queue healthy, ${stats.pendingCount} pending executions`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'BullMQ queue health check failed',
      };
    }
  }

  private async ensureQueue(): Promise<Queue<QueueMessage, string, string, QueueMessage>> {
    if (this.queue) return this.queue;

    const { Queue } = await import('bullmq');
    this.queue = new Queue<QueueMessage>(QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
    return this.queue;
  }

  private async processJob(job: Job<QueueMessage, string, string>): Promise<void> {
    if (!this.executionCallback) {
      throw new Error('BullMQ execution callback is not set');
    }

    const { context, operationId, payload, stepIndex } = job.data;
    await this.executionCallback(operationId, stepIndex, context, payload);
  }

  private async ensureWorker(): Promise<void> {
    if (this.worker) return;

    const { Worker } = await import('bullmq');
    this.worker = new Worker<QueueMessage, string, string>(
      QUEUE_NAME,
      async (job) => {
        log('[%s] Starting BullMQ step %d (jobId: %s)', job.data.operationId, job.data.stepIndex, job.id);
        await this.processJob(job);
        return String(job.id);
      },
      {
        concurrency: Number(process.env.AGENT_RUNTIME_BULLMQ_CONCURRENCY || 4),
        connection: this.connection,
      },
    );

    this.worker.on('failed', (job, error) => {
      log(
        '[%s] BullMQ step %d failed (jobId: %s): %O',
        job?.data.operationId,
        job?.data.stepIndex,
        job?.id,
        error,
      );
    });
  }
}
