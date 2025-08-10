import { OpenAIService } from "./providers/openai";
import { GeminiService } from "./providers/gemini";
import { IAIService, AIProvider, AIServiceOptions } from "./types";

/**
 * 创建 AI 服务实例的工厂函数
 */
export function createAIService(
  provider: AIProvider,
  options: AIServiceOptions,
): IAIService {
  switch (provider) {
    case AIProvider.OPENAI:
      return new OpenAIService(options);

    case AIProvider.AZURE_OPENAI:
      // Azure OpenAI 使用相同的 OpenAI 服务，但需要不同的 baseURL
      return new OpenAIService({
        ...options,
        config: {
          ...options.config,
          baseURL:
            options.config.baseURL ||
            "https://your-resource.openai.azure.com/openai/deployments/your-deployment",
        },
      });

    case AIProvider.GEMINI:
      return new GeminiService(options);

    case AIProvider.DEEPSEEK:
      // DeepSeek 直接用 OpenAIService，baseURL 指向 deepseek
      return new OpenAIService({
        ...options,
        config: {
          ...options.config,
          baseURL: options.config.baseURL || "https://api.deepseek.com/v1",
        },
      });

    case AIProvider.CLAUDE:
      throw new Error("Claude provider not implemented yet");

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * 创建默认的 OpenAI 服务实例
 */
export function createDefaultOpenAIService(apiKey: string): IAIService {
  return createAIService(AIProvider.OPENAI, {
    config: {
      apiKey,
      model: "gpt-4",
      maxTokens: 2000,
      temperature: 0.7,
    },
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    cacheConfig: {
      enabled: true,
      ttl: 3600, // 1小时
      keyPrefix: "ai_cache",
    },
    timeout: 30000, // 30秒
  });
}

/**
 * 创建默认的 Gemini 服务实例
 */
export function createDefaultGeminiService(apiKey: string): IAIService {
  return createAIService(AIProvider.GEMINI, {
    config: {
      apiKey,
      model: "gemini-2.0-flash",
      maxTokens: 2000,
      temperature: 0.7,
    },
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    cacheConfig: {
      enabled: true,
      ttl: 3600, // 1小时
      keyPrefix: "ai_cache",
    },
    timeout: 30000, // 30秒
  });
}

/**
 * 创建默认的 DeepSeek 服务实例
 */
export function createDefaultDeepSeekService(apiKey: string): IAIService {
  return createAIService(AIProvider.DEEPSEEK, {
    config: {
      apiKey,
      baseURL: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      maxTokens: 2000,
      temperature: 0.7,
    },
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    cacheConfig: {
      enabled: true,
      ttl: 3600, // 1小时
      keyPrefix: "ai_cache",
    },
    timeout: 30000, // 30秒
  });
}

/**
 * 从环境变量创建 AI 服务
 * 优先 Gemini，不可用则 OpenAI，不可用再 DeepSeek
 */
export function createAIServiceFromEnv(): IAIService {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const deepseekBaseURL = process.env.DEEPSEEK_API_BASEURL || "https://api.deepseek.com/v1";

  // 优先 Gemini
  if (geminiKey) {
    try {
      const gemini = createDefaultGeminiService(geminiKey);
      // 健康检查，失败则 fallback
      // @ts-ignore
      if (typeof gemini.healthCheck === "function" && gemini.healthCheck() instanceof Promise) {
        // 注意：此处为同步工厂，若需严格健康检查可改为异步
        // 这里直接返回，实际业务可在外层做健康兜底
        return gemini;
      }
    } catch (e) {
      // fallback
    }
  }
  if (azureEndpoint && azureKey) {
    return createAIService(AIProvider.AZURE_OPENAI, {
      config: {
        apiKey: azureKey,
        baseURL: azureEndpoint,
        model: "gpt-4",
        maxTokens: 2000,
        temperature: 0.7,
      },
    });
  }
  if (openaiKey) {
    return createDefaultOpenAIService(openaiKey);
  }
  if (deepseekKey) {
    return createAIService(AIProvider.DEEPSEEK, {
      config: {
        apiKey: deepseekKey,
        baseURL: deepseekBaseURL,
        model: "deepseek-chat",
        maxTokens: 2000,
        temperature: 0.7,
      },
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
      },
      cacheConfig: {
        enabled: true,
        ttl: 3600,
        keyPrefix: "ai_cache",
      },
      timeout: 30000,
    });
  }
  throw new Error(
    "No AI service configuration found in environment variables. Please set GEMINI_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY, or Azure OpenAI credentials.",
  );
}
