/**
 * Simple in-process scheduler for periodic tasks.
 * Tasks run on configurable intervals with status tracking.
 */

interface ScheduledTask {
  name: string;
  description: string;
  intervalMs: number;
  handler: () => Promise<void>;
  lastRun: Date | null;
  nextRun: Date;
  lastStatus: "success" | "failed" | "pending";
  lastError?: string;
  enabled: boolean;
  timer?: ReturnType<typeof setInterval>;
}

const tasks = new Map<string, ScheduledTask>();

export function registerTask(
  name: string,
  description: string,
  intervalMs: number,
  handler: () => Promise<void>,
  enabled = true
): void {
  const existing = tasks.get(name);
  if (existing?.timer) clearInterval(existing.timer);

  const task: ScheduledTask = {
    name,
    description,
    intervalMs,
    handler,
    lastRun: null,
    nextRun: new Date(Date.now() + intervalMs),
    lastStatus: "pending",
    enabled,
  };

  if (enabled) {
    task.timer = setInterval(() => runTask(name), intervalMs);
  }

  tasks.set(name, task);
  console.log(`[Scheduler] Registered: ${name} (every ${intervalMs / 1000}s, enabled=${enabled})`);
}

async function runTask(name: string): Promise<void> {
  const task = tasks.get(name);
  if (!task || !task.enabled) return;

  try {
    console.log(`[Scheduler] Running: ${name}`);
    await task.handler();
    task.lastStatus = "success";
    task.lastError = undefined;
  } catch (error: any) {
    task.lastStatus = "failed";
    task.lastError = error.message;
    console.error(`[Scheduler] Failed: ${name}`, error.message);
  } finally {
    task.lastRun = new Date();
    task.nextRun = new Date(Date.now() + task.intervalMs);
  }
}

export async function triggerTask(name: string): Promise<boolean> {
  const task = tasks.get(name);
  if (!task) return false;
  await runTask(name);
  return true;
}

export function getTaskStatuses(): Array<{
  name: string;
  description: string;
  intervalMs: number;
  lastRun: string | null;
  nextRun: string;
  lastStatus: string;
  lastError?: string;
  enabled: boolean;
}> {
  return Array.from(tasks.values()).map((t) => ({
    name: t.name,
    description: t.description,
    intervalMs: t.intervalMs,
    lastRun: t.lastRun?.toISOString() || null,
    nextRun: t.nextRun.toISOString(),
    lastStatus: t.lastStatus,
    lastError: t.lastError,
    enabled: t.enabled,
  }));
}

export function getTaskNames(): string[] {
  return Array.from(tasks.keys());
}

// ==================== Hotlist Scheduler Facade ====================
// Provides start/getStatus interface expected by init-server and admin/init route.

export const hotlistScheduler = {
  async start(): Promise<void> {
    // Register the hotlist update task if not already registered
    if (!tasks.has("hotlist-update")) {
      const THREE_HOURS = 3 * 60 * 60 * 1000;
      registerTask(
        "hotlist-update",
        "自动更新小红书和抖音热点数据",
        THREE_HOURS,
        async () => {
          // Trigger hotlist updates via internal API
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          await Promise.allSettled([
            fetch(`${baseUrl}/api/hotlist/xiaohongshu`, { method: "POST" }),
            fetch(`${baseUrl}/api/hotlist/douyin`, { method: "POST" }),
          ]);
        },
      );
    }
  },

  getStatus(): {
    isRunning: boolean;
    tasks: ReturnType<typeof getTaskStatuses>;
  } {
    const statuses = getTaskStatuses();
    return {
      isRunning: statuses.some((t) => t.enabled),
      tasks: statuses,
    };
  },
};
