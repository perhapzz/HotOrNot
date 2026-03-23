import { NotificationConfig, INotificationChannel } from "@hotornot/database";

interface HotItem {
  title: string;
  rank: number;
  score?: number | string;
  hotValue?: number;
}

interface HotlistChange {
  platform: string;
  newItems: HotItem[];
  bigMovers: { title: string; oldRank: number; newRank: number }[];
}

/**
 * Detect changes between two hotlist snapshots
 */
export function detectHotlistChanges(
  platform: string,
  oldItems: HotItem[],
  newItems: HotItem[]
): HotlistChange | null {
  if (!oldItems.length || !newItems.length) return null;

  const oldTitles = new Set(oldItems.map((i) => i.title));
  const oldRankMap = new Map(oldItems.map((i) => [i.title, i.rank]));

  const newEntries = newItems.filter((item) => !oldTitles.has(item.title));
  const bigMovers = newItems
    .filter((item) => {
      const oldRank = oldRankMap.get(item.title);
      return oldRank !== undefined && Math.abs(oldRank - item.rank) >= 10;
    })
    .map((item) => ({
      title: item.title,
      oldRank: oldRankMap.get(item.title)!,
      newRank: item.rank,
    }));

  if (newEntries.length === 0 && bigMovers.length === 0) return null;

  return {
    platform,
    newItems: newEntries.slice(0, 10),
    bigMovers: bigMovers.slice(0, 10),
  };
}

/**
 * Send notification via configured channels
 */
export async function sendNotification(
  channel: INotificationChannel,
  title: string,
  content: string
): Promise<boolean> {
  try {
    if (channel.type === "dingtalk" && channel.webhook) {
      return await sendDingtalk(channel.webhook, title, content);
    } else if (channel.type === "feishu" && channel.webhook) {
      return await sendFeishu(channel.webhook, title, content);
    } else if (channel.type === "email" && channel.address) {
      // Email interface reserved — implement with Resend/Nodemailer
      console.log(`[notification] Email to ${channel.address}: ${title}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[notification] Failed to send via ${channel.type}:`, err);
    return false;
  }
}

async function sendDingtalk(webhook: string, title: string, content: string): Promise<boolean> {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        title,
        text: `## ${title}\n\n${content}`,
      },
    }),
  });
  const data = await res.json();
  return data.errcode === 0;
}

async function sendFeishu(webhook: string, title: string, content: string): Promise<boolean> {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg_type: "interactive",
      card: {
        header: {
          title: { tag: "plain_text", content: title },
          template: "blue",
        },
        elements: [
          {
            tag: "markdown",
            content,
          },
        ],
      },
    }),
  });
  const data = await res.json();
  return data.code === 0 || data.StatusCode === 0;
}

/**
 * Format hotlist changes to markdown notification
 */
export function formatChangesMarkdown(changes: HotlistChange): string {
  const lines: string[] = [];

  if (changes.newItems.length > 0) {
    lines.push("**🆕 新上榜：**");
    changes.newItems.forEach((item) => {
      lines.push(`- #${item.rank} ${item.title}`);
    });
  }

  if (changes.bigMovers.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("**📈 排名大幅变动：**");
    changes.bigMovers.forEach((item) => {
      const direction = item.newRank < item.oldRank ? "↑" : "↓";
      lines.push(
        `- ${item.title}: #${item.oldRank} → #${item.newRank} ${direction}`
      );
    });
  }

  return lines.join("\n");
}

/**
 * Process notifications for all users after a hotlist update
 */
export async function processHotlistNotifications(
  platform: string,
  oldItems: HotItem[],
  newItems: HotItem[]
) {
  const changes = detectHotlistChanges(platform, oldItems, newItems);
  if (!changes) return;

  const configs = await NotificationConfig.find({
    enabled: true,
    "rules.platform": { $in: [platform, "all"] },
  });

  const content = formatChangesMarkdown(changes);
  const title = `🔥 ${platform} 热榜变动`;

  // Rate limit: min 10 minutes between notifications per user
  const minInterval = 10 * 60 * 1000;

  for (const config of configs) {
    if (
      config.lastNotifiedAt &&
      Date.now() - config.lastNotifiedAt.getTime() < minInterval
    ) {
      continue;
    }

    for (const channel of config.channels) {
      if (!channel.enabled) continue;
      await sendNotification(channel, title, content);
    }

    config.lastNotifiedAt = new Date();
    await config.save();
  }
}
