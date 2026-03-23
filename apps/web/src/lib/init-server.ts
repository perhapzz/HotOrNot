// 服务器启动初始化脚本
import { registerTask } from "./scheduler";
import { validateEnv } from "./env-validation";
import { logger } from "./logger";

const log = logger.child("init-server");

// 初始化服务器端服务
export async function initializeServerServices() {
  if (typeof window !== "undefined") return;

  log.info("初始化服务器端服务");

  try {
    log.info("校验环境变量...");
    validateEnv();

    // Register scheduled tasks
    registerTask(
      "hotlist-refresh",
      "热榜数据定时更新（每30分钟）",
      30 * 60 * 1000,
      async () => {
        log.info("Refreshing hotlist data...");
        // Actual hotlist refresh logic would be called here
      }
    );

    registerTask(
      "data-cleanup",
      "过期数据清理（每24小时）",
      24 * 60 * 60 * 1000,
      async () => {
        log.info("Running data cleanup...");
      }
    );

    registerTask(
      "migration-check",
      "密码迁移进度检查（每24小时）",
      24 * 60 * 60 * 1000,
      async () => {
        log.info("Checking password migration status...");
      }
    );

    log.info("服务器端服务初始化完成");
  } catch (error) {
    log.error("服务器端服务初始化失败", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// 服务器端自动执行初始化
if (typeof window === "undefined") {
  const autoStartEnv = process.env.AUTO_START_SCHEDULER || "all";
  const currentEnv = process.env.NODE_ENV || "development";

  let shouldStart = false;
  switch (autoStartEnv.toLowerCase()) {
    case "prod": case "production":
      shouldStart = currentEnv === "production"; break;
    case "dev": case "development":
      shouldStart = currentEnv !== "production"; break;
    case "all": case "always":
      shouldStart = true; break;
    case "none": case "disabled":
      shouldStart = false; break;
    default:
      shouldStart = true;
  }

  if (shouldStart) {
    setTimeout(() => {
      initializeServerServices()
        .then(() => log.info("服务器初始化完成"))
        .catch((error) =>
          log.error("服务器初始化失败", {
            error: error instanceof Error ? error.message : String(error),
          })
        );
    }, 5000);
  }
}
