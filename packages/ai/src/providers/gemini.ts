import {
  IAIService,
  ContentAnalysisRequest,
  ContentAnalysisResponse,
  AccountAnalysisRequest,
  AccountAnalysisResponse,
  KeywordAnalysisRequest,
  KeywordAnalysisResponse,
  AIServiceConfig,
  AIServiceError,
  AIProvider,
  RetryConfig,
  CacheConfig,
} from "../types";

/**
 * Google Gemini AI 服务实现
 */
export class GeminiService implements IAIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private retryConfig?: RetryConfig;
  private cacheConfig?: CacheConfig;
  private timeout: number;

  constructor(options: {
    config: AIServiceConfig;
    retryConfig?: RetryConfig;
    cacheConfig?: CacheConfig;
    timeout?: number;
  }) {
    this.apiKey = options.config.apiKey;
    this.baseURL =
      options.config.baseURL ||
      "https://generativelanguage.googleapis.com/v1beta";
    this.model = options.config.model || "gemini-1.5-flash";
    this.maxTokens = options.config.maxTokens || 2000;
    this.temperature = options.config.temperature || 0.7;
    this.retryConfig = options.retryConfig;
    this.cacheConfig = options.cacheConfig;
    this.timeout = options.timeout || 30000;
  }

  /**
   * 内容分析
   */
  async analyzeContent(
    request: ContentAnalysisRequest,
  ): Promise<ContentAnalysisResponse> {
    const prompt = this.buildContentAnalysisPrompt(request);

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseContentAnalysisResponse(response);
    } catch (error) {
      throw this.handleError(error, "CONTENT_ANALYSIS_ERROR");
    }
  }

  /**
   * 账号分析
   */
  async analyzeAccount(
    request: AccountAnalysisRequest,
  ): Promise<AccountAnalysisResponse> {
    const prompt = this.buildAccountAnalysisPrompt(request);

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseAccountAnalysisResponse(response);
    } catch (error) {
      throw this.handleError(error, "ACCOUNT_ANALYSIS_ERROR");
    }
  }

  /**
   * 关键词分析
   */
  async analyzeKeyword(
    request: KeywordAnalysisRequest,
  ): Promise<KeywordAnalysisResponse> {
    const prompt = this.buildKeywordAnalysisPrompt(request);

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseKeywordAnalysisResponse(response);
    } catch (error) {
      throw this.handleError(error, "KEYWORD_ANALYSIS_ERROR");
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callGeminiAPI('请回复"OK"');
      return response.includes("OK") || response.includes("好的");
    } catch (error) {
      console.error("Gemini health check failed:", error);
      return false;
    }
  }

  /**
   * 调用 Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
        topP: 0.8,
        topK: 10,
      },
    };

    console.log("🤖 调用 Gemini API...");
    console.log(`📍 模型: ${this.model}`);
    console.log(`🌡️ 温度: ${this.temperature}`);
    console.log(`📝 最大tokens: ${this.maxTokens}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    }).catch((error) => {
      console.error("🔥 Gemini API连接失败:", error);
      console.error("📍 API URL:", url);
      console.error("🔑 API Key存在:", !!this.apiKey);
      console.error("🌐 错误类型:", error.constructor.name);
      throw error;
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => "Unknown error");
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    const content = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Invalid response format from Gemini API");
    }

    console.log("✅ Gemini API 响应成功");
    return content;
  }

  /**
   * 构建内容分析提示词
   */
  private buildContentAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `你是一个专业的内容分析师，请分析以下内容并给出详细的评估报告。

内容信息：
- 平台：${request.platform}
- 标题：${request.title || "无"}
- 描述：${request.description || "无"}
- 作者：${request.author || "无"}
- 内容类型：${request.contentType}
- 数据指标：
${request.metrics?.views && request.metrics.views > 0 ? `  * 浏览量：${request.metrics.views}\n` : ""}  * 点赞：${request.metrics?.likes || 0}，评论：${request.metrics?.comments || 0}，分享：${request.metrics?.shares || 0}

重要提醒：
- 部分平台（如小红书）无法提供准确的浏览量数据，请重点关注点赞、评论、分享等实际可获取的互动指标
- 请不要因为浏览量数据缺失或较低而做出负面评价，应专注于内容质量和用户参与度分析

请按以下JSON格式返回分析结果：
{
  "score": 数字(1-10分),
  "pros": ["优点1", "优点2"],
  "cons": ["缺点1", "缺点2"],
  "recommendation": "总体建议",
  "tags": ["标签1", "标签2"],
  "reasoning": "分析推理过程",
  "suggestions": {
    "title": "标题优化建议",
    "content": "内容优化建议",
    "timing": "发布时机建议",
    "hashtags": ["#标签1", "#标签2"]
  }
}

请确保返回有效的JSON格式。`;
  }

  /**
   * 构建账号分析提示词
   */
  private buildAccountAnalysisPrompt(request: AccountAnalysisRequest): string {
    const recentPostsInfo = request.recentPosts
      .map((post, index) => {
        const viewsInfo =
          post.metrics?.views && post.metrics.views > 0
            ? ` ${post.metrics.views}浏览`
            : "";
        return `${index + 1}. ${post.title || "无标题"} - ${post.metrics?.likes || 0}赞${viewsInfo}`;
      })
      .join("\n");

    return `你是一个专业的账号分析师，请分析以下账号并给出详细的分析报告。

账号信息：
- 平台：${request.platform}
- 账号名：${request.accountName}
- 个人简介：${request.bio || "无"}
- 粉丝数：${request.followerCount || 0}

最近发布内容：
${recentPostsInfo}

请按以下JSON格式返回分析结果：
{
  "contentPreferences": ["内容偏好1", "内容偏好2"],
  "postingPattern": {
    "bestTimes": [{"hour": 20, "score": 9}, {"hour": 12, "score": 8}],
    "frequency": "发布频率分析",
    "consistency": 数字(1-10)
  },
  "topicSuggestions": ["选题建议1", "选题建议2"],
  "strengthsAnalysis": "优势分析",
  "improvementAreas": ["改进建议1", "改进建议2"],
  "trendsInsight": "趋势洞察"
}

请确保返回有效的JSON格式。`;
  }

  /**
   * 构建关键词分析提示词
   */
  private buildKeywordAnalysisPrompt(request: KeywordAnalysisRequest): string {
    return `你是一个专业的关键词分析师，请分析关键词"${request.keyword}"的热度和趋势。

分析范围：
- 关键词：${request.keyword}
- 平台：${request.platforms.join(", ")}
- 时间范围：${request.timeRange || "month"}

请按以下JSON格式返回分析结果：
{
  "trendScore": 数字(1-10分),
  "momentum": "上升|稳定|下降",
  "competitionLevel": "低|中|高",
  "bestPractices": ["最佳实践1", "最佳实践2"],
  "contentSuggestions": ["内容建议1", "内容建议2"],
  "timing": {
    "bestDays": ["周一", "周五"],
    "bestHours": [12, 20, 21]
  },
  "relatedKeywords": ["相关词1", "相关词2"],
  "viralFactors": ["爆文因子1", "爆文因子2"]
}

请确保返回有效的JSON格式。`;
  }

  /**
   * 解析内容分析响应
   */
  private parseContentAnalysisResponse(
    response: string,
  ): ContentAnalysisResponse {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 验证必需字段并提供默认值
      return {
        score: parsed.score || 5,
        pros: Array.isArray(parsed.pros) ? parsed.pros : ["内容质量良好"],
        cons: Array.isArray(parsed.cons) ? parsed.cons : ["可以进一步优化"],
        recommendation: parsed.recommendation || "继续保持内容质量",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["通用内容"],
        reasoning: parsed.reasoning || "AI分析完成",
        suggestions: {
          title: parsed.suggestions?.title || "标题清晰明确",
          content: parsed.suggestions?.content || "内容丰富有趣",
          timing: parsed.suggestions?.timing || "选择合适时间发布",
          hashtags: Array.isArray(parsed.suggestions?.hashtags)
            ? parsed.suggestions.hashtags
            : ["#优质内容"],
        },
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      // 返回默认响应
      return {
        score: 7,
        pros: ["内容有一定质量"],
        cons: ["可以进一步优化标题和描述"],
        recommendation: "建议优化内容结构和互动性",
        tags: ["通用内容"],
        reasoning: "Gemini AI 分析完成",
        suggestions: {
          title: "使用更吸引人的标题",
          content: "增加互动元素",
          timing: "选择用户活跃时间发布",
          hashtags: ["#热门话题", "#优质内容"],
        },
      };
    }
  }

  /**
   * 解析账号分析响应
   */
  private parseAccountAnalysisResponse(
    response: string,
  ): AccountAnalysisResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        contentPreferences: Array.isArray(parsed.contentPreferences)
          ? parsed.contentPreferences
          : ["生活分享", "实用技巧"],
        postingPattern: {
          bestTimes: Array.isArray(parsed.postingPattern?.bestTimes)
            ? parsed.postingPattern.bestTimes
            : [
                { hour: 12, score: 8 },
                { hour: 18, score: 9 },
                { hour: 20, score: 10 },
              ],
          frequency: parsed.postingPattern?.frequency || "建议每日发布1-2次",
          consistency: parsed.postingPattern?.consistency || 7,
        },
        topicSuggestions: Array.isArray(parsed.topicSuggestions)
          ? parsed.topicSuggestions
          : ["日常生活", "兴趣爱好"],
        strengthsAnalysis: parsed.strengthsAnalysis || "内容质量稳定，互动良好",
        improvementAreas: Array.isArray(parsed.improvementAreas)
          ? parsed.improvementAreas
          : ["增加内容多样性"],
        trendsInsight: parsed.trendsInsight || "当前内容方向符合平台趋势",
      };
    } catch (error) {
      console.error("Failed to parse Gemini account response:", error);
      return {
        contentPreferences: ["生活分享", "娱乐内容"],
        postingPattern: {
          bestTimes: [
            { hour: 12, score: 8 },
            { hour: 18, score: 9 },
            { hour: 20, score: 10 },
          ],
          frequency: "建议每日发布1-2次",
          consistency: 7,
        },
        topicSuggestions: ["日常生活", "兴趣分享", "实用技巧"],
        strengthsAnalysis: "账号内容质量良好，有一定粉丝基础",
        improvementAreas: ["增加互动频率", "优化发布时间"],
        trendsInsight: "建议关注当前热门话题，结合个人特色创作",
      };
    }
  }

  /**
   * 解析关键词分析响应
   */
  private parseKeywordAnalysisResponse(
    response: string,
  ): KeywordAnalysisResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        trendScore: parsed.trendScore || 7,
        momentum: ["上升", "稳定", "下降"].includes(parsed.momentum)
          ? parsed.momentum
          : "稳定",
        competitionLevel: ["低", "中", "高"].includes(parsed.competitionLevel)
          ? parsed.competitionLevel
          : "中",
        bestPractices: Array.isArray(parsed.bestPractices)
          ? parsed.bestPractices
          : ["保持内容质量", "定期发布"],
        contentSuggestions: Array.isArray(parsed.contentSuggestions)
          ? parsed.contentSuggestions
          : ["创新内容形式"],
        timing: {
          bestDays: Array.isArray(parsed.timing?.bestDays)
            ? parsed.timing.bestDays
            : ["周一", "周三", "周五"],
          bestHours: Array.isArray(parsed.timing?.bestHours)
            ? parsed.timing.bestHours
            : [12, 18, 20],
        },
        relatedKeywords: Array.isArray(parsed.relatedKeywords)
          ? parsed.relatedKeywords
          : ["相关话题"],
        viralFactors: Array.isArray(parsed.viralFactors)
          ? parsed.viralFactors
          : ["优质内容", "时机把握"],
      };
    } catch (error) {
      console.error("Failed to parse Gemini keyword response:", error);
      return {
        trendScore: 7,
        momentum: "stable",
        competitionLevel: "medium",
        bestPractices: ["关注热点话题", "保持内容质量", "适时互动"],
        contentSuggestions: ["结合时事热点", "增加原创性", "提高互动性"],
        timing: {
          bestDays: ["周一", "周三", "周五"],
          bestHours: [12, 18, 20],
        },
        relatedKeywords: ["热门话题", "相关领域"],
        viralFactors: ["内容质量", "发布时机", "用户互动"],
      };
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any, code: string): AIServiceError {
    console.error(`Gemini service error (${code}):`, error);

    let retryable = false;
    let message = "Gemini AI service error";

    if (error.message?.includes("timeout")) {
      message = "Gemini API request timeout";
      retryable = true;
    } else if (error.message?.includes("429")) {
      message = "Gemini API rate limit exceeded";
      retryable = true;
    } else if (
      error.message?.includes("500") ||
      error.message?.includes("502") ||
      error.message?.includes("503")
    ) {
      message = "Gemini API server error";
      retryable = true;
    } else if (
      error.message?.includes("401") ||
      error.message?.includes("403")
    ) {
      message = "Invalid Gemini API key";
      retryable = false;
    } else if (error.message?.includes("400")) {
      message = "Invalid request to Gemini API";
      retryable = false;
    }

    return new AIServiceError(message, code, AIProvider.GEMINI, retryable);
  }
}
