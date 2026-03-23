// 服务器启动初始化脚本
import { hotlistScheduler } from "./scheduler";
import { validateEnv } from "./env-validation";

// 初始化服务器端服务
export async function initializeServerServices() {
  // 只在服务器端执行
  if (typeof window !== "undefined") {
    return;
  }

  console.log("🚀 ===========================================");
  console.log("🚀 初始化服务器端服务");
  console.log("🚀 ===========================================");

  try {
    // 校验环境变量
    console.log("🔐 校验环境变量...");
    validateEnv();

    // 启动热点数据定时更新服务
    console.log("📅 启动热点数据定时更新服务...");
    await hotlistScheduler.start();
    console.log("✅ 热点数据定时更新服务启动成功");

    console.log("🚀 ===========================================");
    console.log("🚀 服务器端服务初始化完成");
    console.log("🚀 ===========================================");
  } catch (error) {
    console.error("❌ 服务器端服务初始化失败:", error);
  }
}

// 服务器端自动执行初始化（根据环境变量控制）
if (typeof window === "undefined") {
  console.log("🔄 ============ 服务器初始化开始 ============");
  console.log("🔄 检测到服务器端环境，准备启动初始化服务...");
  console.log("🔄 当前环境:", process.env.NODE_ENV || "development");
  console.log(
    "🔄 Docker环境检测:",
    process.env.NODE_ENV === "production" ? "Docker生产环境" : "本地开发环境",
  );

  // 检查自动启动环境变量
  const autoStartEnv = process.env.AUTO_START_SCHEDULER || "all";
  const currentEnv = process.env.NODE_ENV || "development";

  console.log("🔄 定时器自动启动策略:", autoStartEnv);
  console.log("🔄 环境变量完整信息:");
  console.log("   NODE_ENV:", process.env.NODE_ENV);
  console.log("   AUTO_START_SCHEDULER:", process.env.AUTO_START_SCHEDULER);
  console.log("   TIKHUB_API_KEY存在:", !!process.env.TIKHUB_API_KEY);

  let shouldStart = false;

  switch (autoStartEnv.toLowerCase()) {
    case "prod":
    case "production":
      shouldStart = currentEnv === "production";
      console.log("🔄 生产环境策略 - shouldStart:", shouldStart);
      break;
    case "dev":
    case "development":
      shouldStart = currentEnv !== "production";
      console.log("🔄 开发环境策略 - shouldStart:", shouldStart);
      break;
    case "all":
    case "always":
      shouldStart = true;
      console.log("🔄 所有环境策略 - shouldStart:", shouldStart);
      break;
    case "none":
    case "disabled":
      shouldStart = false;
      console.log("🔄 禁用策略 - shouldStart:", shouldStart);
      break;
    default:
      console.log("⚠️  未知的自动启动策略，使用默认值 (all)");
      shouldStart = true;
  }

  console.log("🔄 最终决定 - shouldStart:", shouldStart);

  if (shouldStart) {
    console.log("✅ 符合启动条件，准备启动定时器服务...");
    console.log("✅ 将在5秒后开始初始化，确保数据库连接就绪...");
    // 延迟执行，确保应用完全启动和数据库连接就绪
    setTimeout(() => {
      console.log("🔄 ========== 开始执行延迟初始化 ==========");
      initializeServerServices()
        .then(() => {
          console.log("🎉 服务器初始化完成");
        })
        .catch((error) => {
          console.error("❌ 服务器初始化失败:", error);
        });
    }, 5000); // 增加到5秒后启动
  } else {
    console.log("⏸️  不符合启动条件，跳过定时器自动启动");
    console.log("💡 如需手动启动，可访问 /admin/scheduler 管理页面");
  }

  console.log("🔄 ============ 服务器初始化脚本加载完成 ============");
}
