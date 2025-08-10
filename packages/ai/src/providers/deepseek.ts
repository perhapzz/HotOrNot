import { 
  IAIService,
  ContentAnalysisRequest,
  ContentAnalysisResponse,
  AccountAnalysisRequest,
  AccountAnalysisResponse,
  KeywordAnalysisRequest,
  KeywordAnalysisResponse,
  AIServiceOptions,
  AIServiceError,
  AIProvider,
} from "../types";

import OpenAI from "openai";

export class DeepSeekService implements IAIService {
  private client: any;
  private options: AIServiceOptions;

  constructor(options: AIServiceOptions) {
    this.options = options;
    this.client = new OpenAI({
      apiKey: options.config.apiKey,
      baseURL: options.config.baseURL,
    });
  }

  async analyzeContent(
    request: ContentAnalysisRequest,
  ): Promise<ContentAnalysisResponse> {
    try {
      const prompt = this.buildContentAnalysisPrompt(request);
      const completion = await this.client.chat.completions.create({
        model: this.options.config.model || "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的内容分析师，请分析以下内容并给出详细的评估报告。请确保返回有效的JSON格式。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.options.config.maxTokens || 2000,
        temperature: this.options.config.temperature || 0.7,
      });
      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new AIServiceError(
          "Empty response from AI service",
          "EMPTY_RESPONSE",
          AIProvider.DEEPSEEK,
        );
      }
      return this.parseContentAnalysisResponse(responseText);
    } catch (error) {
      if (error instanceof AIServiceError && error.code === "PARSE_ERROR") {
        return {
          score: 7,
          pros: ["内容有一定质量"],
          cons: ["可以进一步优化标题和描述"],
          recommendation: "建议优化内容结构和互动性",
          tags: ["通用内容"],
          reasoning: "AI分析完成",
          suggestions: {
            title: "使用更吸引人的标题",
            content: "增加互动元素",
            timing: "选择用户活跃时间发布",
            hashtags: ["#热门话题", "#优质内容"],
          },
        };
      }
      throw this.handleError(error);
    }
  }

  async analyzeAccount(
    request: AccountAnalysisRequest,
  ): Promise<AccountAnalysisResponse> {
    try {
      const prompt = this.buildAccountAnalysisPrompt(request);
      const completion = await this.client.chat.completions.create({
        model: this.options.config.model || "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的账号分析师，请分析以下账号并给出详细的分析报告。请确保返回有效的JSON格式。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.options.config.maxTokens || 2500,
        temperature: this.options.config.temperature || 0.7,
      });
      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new AIServiceError(
          "Empty response from AI service",
          "EMPTY_RESPONSE",
          AIProvider.DEEPSEEK,
        );
      }
      return this.parseAccountAnalysisResponse(responseText);
    } catch (error) {
      if (error instanceof AIServiceError && error.code === "PARSE_ERROR") {
        return {
          contentPreferences: ["生活分享", "娱乐内容"],
          postingPattern: {
            bestTimes: [
              { hour: 12, score: 8 },
              { hour: 18, score: 9 },
              { hour: 20, score: 10 },
            ],
            frequency: "发布频率分析",
            consistency: 7,
          },
          topicSuggestions: ["日常生活", "兴趣分享", "实用技巧"],
          strengthsAnalysis: "账号内容质量良好，有一定粉丝基础",
          improvementAreas: ["增加互动频率", "优化发布时间"],
          trendsInsight: "建议关注当前热门话题，结合个人特色创作",
        };
      }
      throw this.handleError(error);
    }
  }

  async analyzeKeyword(
    request: KeywordAnalysisRequest,
  ): Promise<KeywordAnalysisResponse> {
    try {
      const prompt = this.buildKeywordAnalysisPrompt(request);
      const completion = await this.client.chat.completions.create({
        model: this.options.config.model || "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的关键词分析师，请分析关键词的热度和趋势。请确保返回有效的JSON格式。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.options.config.maxTokens || 2000,
        temperature: this.options.config.temperature || 0.7,
      });
      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new AIServiceError(
          "Empty response from AI service",
          "EMPTY_RESPONSE",
          AIProvider.DEEPSEEK,
        );
      }
      return this.parseKeywordAnalysisResponse(responseText);
    } catch (error) {
      if (error instanceof AIServiceError && error.code === "PARSE_ERROR") {
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
      throw this.handleError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.options.config.model || "deepseek-chat",
        messages: [{ role: "user", content: "请回复\"OK\"" }],
        max_tokens: 5,
      });
      const text = completion.choices[0].message.content || "";
      return text.includes("OK") || text.includes("好的");
    } catch {
      return false;
    }
  }

  private buildContentAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `你是一个专业的内容分析师，请分析以下内容并给出详细的评估报告。\n\n内容信息：\n- 平台：${request.platform}\n- 标题：${request.title || "无"}\n- 描述：${request.description || "无"}\n- 作者：${request.author || "无"}\n- 内容类型：${request.contentType}\n- 数据指标：\n${request.metrics?.views && request.metrics.views > 0 ? `  * 浏览量：${request.metrics.views}\n` : ""}  * 点赞：${request.metrics?.likes || 0}，评论：${request.metrics?.comments || 0}，分享：${request.metrics?.shares || 0}\n\n重要提醒：\n- 部分平台（如小红书）无法提供准确的浏览量数据，请重点关注点赞、评论、分享等实际可获取的互动指标\n- 请不要因为浏览量数据缺失或较低而做出负面评价，应专注于内容质量和用户参与度分析\n\n请按以下JSON格式返回分析结果：\n{\n  "score": 数字(1-10分),\n  "pros": ["优点1", "优点2"],\n  "cons": ["缺点1", "缺点2"],\n  "recommendation": "总体建议",\n  "tags": ["标签1", "标签2"],\n  "reasoning": "分析推理过程",\n  "suggestions": {\n    "title": "标题优化建议",\n    "content": "内容优化建议",\n    "timing": "发布时机建议",\n    "hashtags": ["#标签1", "#标签2"]\n  }\n}\n\n请确保返回有效的JSON格式。`;
  }

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
    return `你是一个专业的账号分析师，请分析以下账号并给出详细的分析报告。\n\n账号信息：\n- 平台：${request.platform}\n- 账号名：${request.accountName}\n- 个人简介：${request.bio || "无"}\n- 粉丝数：${request.followerCount || 0}\n\n最近发布内容：\n${recentPostsInfo}\n\n请按以下JSON格式返回分析结果：\n{\n  "contentPreferences": ["内容偏好1", "内容偏好2"],\n  "postingPattern": {\n    "bestTimes": [{"hour": 20, "score": 9}, {"hour": 12, "score": 8}],\n    "frequency": "发布频率分析",\n    "consistency": 数字(1-10)\n  },\n  "topicSuggestions": ["选题建议1", "选题建议2"],\n  "strengthsAnalysis": "优势分析",\n  "improvementAreas": ["改进建议1", "改进建议2"],\n  "trendsInsight": "趋势洞察"\n}\n\n请确保返回有效的JSON格式。`;
  }

  private buildKeywordAnalysisPrompt(request: KeywordAnalysisRequest): string {
    return `你是一个专业的关键词分析师，请分析关键词\"${request.keyword}\"的热度和趋势。\n\n分析范围：\n- 关键词：${request.keyword}\n- 平台：${request.platforms.join(", ")}\n- 时间范围：${request.timeRange || "month"}\n\n请按以下JSON格式返回分析结果：\n{\n  "trendScore": 数字(1-10分),\n  "momentum": "上升|稳定|下降",\n  "competitionLevel": "低|中|高",\n  "bestPractices": ["最佳实践1", "最佳实践2"],\n  "contentSuggestions": ["内容建议1", "内容建议2"],\n  "timing": {\n    "bestDays": ["周一", "周五"],\n    "bestHours": [12, 20, 21]\n  },\n  "relatedKeywords": ["相关词1", "相关词2"],\n  "viralFactors": ["爆文因子1", "爆文因子2"]\n}\n\n请确保返回有效的JSON格式。`;
  }

  private parseContentAnalysisResponse(
    responseText: string,
  ): ContentAnalysisResponse {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
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
      throw new AIServiceError(
        "Failed to parse AI response",
        "PARSE_ERROR",
        AIProvider.DEEPSEEK,
      );
    }
  }

  private parseAccountAnalysisResponse(
    responseText: string,
  ): AccountAnalysisResponse {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
      throw new AIServiceError(
        "Failed to parse AI response",
        "PARSE_ERROR",
        AIProvider.DEEPSEEK,
      );
    }
  }

  private parseKeywordAnalysisResponse(
    responseText: string,
  ): KeywordAnalysisResponse {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
      throw new AIServiceError(
        "Failed to parse AI response",
        "PARSE_ERROR",
        AIProvider.DEEPSEEK,
      );
    }
  }

  private handleError(error: any): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }
    let retryable = false;
    let message = "DeepSeek service error";
    if (error?.message?.includes("timeout")) {
      message = "DeepSeek API request timeout";
      retryable = true;
    } else if (error?.message?.includes("429")) {
      message = "DeepSeek API rate limit exceeded";
      retryable = true;
    } else if (
      error?.message?.includes("500") ||
      error?.message?.includes("502") ||
      error?.message?.includes("503")
    ) {
      message = "DeepSeek API server error";
      retryable = true;
    } else if (
      error?.message?.includes("401") ||
      error?.message?.includes("403")
    ) {
      message = "Invalid DeepSeek API key";
      retryable = false;
    } else if (error?.message?.includes("400")) {
      message = "Invalid request to DeepSeek API";
      retryable = false;
    }
    return new AIServiceError(
      message,
      "DEEPSEEK_ERROR",
      AIProvider.DEEPSEEK,
      retryable,
    );
  }
}
