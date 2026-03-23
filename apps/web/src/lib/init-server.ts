// 服务器启动初始化脚本
import { hotlistScheduler } from "./scheduler";
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

    log.info("启动热点数据定时更新服务...");
    await hotlistScheduler.start();
    log.info("热点数据定时更新服务启动成功");

    log.info("服务器端服务初始化完成");
  } catch (error) {
    log.error("服务器端服务初始化失败", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// 服务器端自动执行初始化（根据环境变量控制）
if (typeof window === "undefined") {
  const autoStartEnv = process.env.AUTO_START_SCHEDULER || "all";
  const currentEnv = process.env.NODE_ENV || "development";

  log.info("服务器初始化开始", {
    env: currentEnv,
    schedulerStrategy: autoStartEnv,
    docker: currentEnv === "production",
    tikhubKeyPresent: !!process.env.TIKHUB_API_KEY,
  });

  let shouldStart = false;

  switch (autoStartEnv.toLowerCase()) {
    case "prod":
    case "production":
      shouldStart = currentEnv === "production";
      break;
    case "dev":
    case "development":
      shouldStart = currentEnv !== "production";
      break;
    case "all":
    case "always":
      shouldStart = true;
      break;
    case "none":
    case "disabled":
      shouldStart = false;
      break;
    default:
      log.warn("未知的自动启动策略，使用默认值 (all)", { strategy: autoStartEnv });
      shouldStart = true;
  }

  log.info("定时器启动决策", { shouldStart, strategy: autoStartEnv });

  if (shouldStart) {
    log.info("将在5秒后开始初始化，确保数据库连接就绪");
    setTimeout(() => {
      initializeServerServices()
        .then(() => log.info("服务器初始化完成"))
        .catch((error) =>
          log.error("服务器初始化失败", {
            error: error instanceof Error ? error.message : String(error),
          }),
        );
    }, 5000);
  } else {
    log.info("跳过定时器自动启动，可访问 /admin/scheduler 手动启动");
  }
}
