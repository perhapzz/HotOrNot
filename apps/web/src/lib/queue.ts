import { Queue, Worker, Job } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function parseRedisConnection(url: string) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || "localhost",
      port: parseInt(u.port) || 6379,
      password: u.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

const connection = parseRedisConnection(REDIS_URL);

// ==================== Queues ====================

export const analysisQueue = new Queue("analysis", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
});

export const hotlistQueue = new Queue("hotlist", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 10 },
  },
});

// ==================== Job submission helpers ====================

export interface AnalysisJobData {
  type: "content" | "keyword" | "account";
  userId: string;
  params: Record<string, any>;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export async function submitAnalysisJob(data: AnalysisJobData): Promise<string> {
  const job = await analysisQueue.add("analyze", data, {
    priority: data.type === "content" ? 1 : 2,
  });
  return job.id!;
}

export async function submitEmailJob(data: EmailJobData): Promise<string> {
  const job = await emailQueue.add("send", data);
  return job.id!;
}

// ==================== Queue status ====================

export async function getQueueStatus(queueName: string) {
  const q = queueName === "analysis" ? analysisQueue : queueName === "email" ? emailQueue : hotlistQueue;
  const [waiting, active, completed, failed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
  ]);
  return { name: queueName, waiting, active, completed, failed };
}

export async function getAllQueueStatuses() {
  return Promise.all(["analysis", "email", "hotlist"].map(getQueueStatus));
}

// ==================== Worker factory ====================

export function createAnalysisWorker(
  processor: (job: Job<AnalysisJobData>) => Promise<any>
) {
  return new Worker("analysis", processor, {
    connection,
    concurrency: 3,
  });
}

export function createEmailWorker(
  processor: (job: Job<EmailJobData>) => Promise<any>
) {
  return new Worker("email", processor, {
    connection,
    concurrency: 5,
  });
}
