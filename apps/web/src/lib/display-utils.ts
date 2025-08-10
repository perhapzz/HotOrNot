/**
 * 显示工具函数 - 将数据库中的英文枚举值转换为中文显示
 */

/**
 * 转换趋势方向为中文
 */
export function getTrendDirectionText(trendDirection: string): string {
  switch (trendDirection) {
    case 'rising':
      return '上升';
    case 'declining':
      return '下降';
    case 'stable':
      return '稳定';
    default:
      return '未知';
  }
}

/**
 * 转换推荐程度为中文
 */
export function getRecommendationLevelText(recommendationLevel: string): string {
  switch (recommendationLevel) {
    case 'high':
      return '高';
    case 'medium':
      return '中等';
    case 'low':
      return '低';
    default:
      return '未知';
  }
}

/**
 * 转换分析状态为中文
 */
export function getAnalysisStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'pending':
      return '处理中';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
}

/**
 * 转换分析类型为中文
 */
export function getAnalysisTypeText(analysisType: string): string {
  switch (analysisType) {
    case 'content':
      return '内容分析';
    case 'account':
      return '账号分析';
    case 'keyword':
      return '关键词分析';
    default:
      return '未知类型';
  }
}

/**
 * 获取趋势方向的颜色样式
 */
export function getTrendDirectionColor(trendDirection: string): string {
  switch (trendDirection) {
    case 'rising':
      return 'text-green-600';
    case 'declining':
      return 'text-red-600';
    case 'stable':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * 获取推荐程度的颜色样式
 */
export function getRecommendationLevelColor(recommendationLevel: string): string {
  switch (recommendationLevel) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}