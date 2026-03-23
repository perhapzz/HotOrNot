import { Feedback } from "@hotornot/database";

interface QualityScore {
  completeness: number; // 0-100
  satisfaction: number; // 0-100
  overall: number; // 0-100
  sampleSize: number;
}

/**
 * Evaluate analysis result completeness.
 * Checks for expected fields: score, suggestions, tags, summary.
 */
export function scoreCompleteness(analysis: any): number {
  if (!analysis) return 0;

  const checks = [
    !!analysis.overallScore || !!analysis.hotScore,
    Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0,
    Array.isArray(analysis.tags) && analysis.tags.length > 0,
    !!analysis.summary || !!analysis.analysis?.summary,
    !!analysis.platform,
    typeof analysis.overallScore === "number" || typeof analysis.hotScore === "number",
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * Calculate user satisfaction score from feedback data.
 */
export async function scoreSatisfaction(
  analysisType?: string,
  days = 30
): Promise<{ score: number; total: number; positive: number; negative: number }> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const filter: any = { createdAt: { $gte: since } };
  if (analysisType) filter.analysisType = analysisType;

  const feedbacks = await Feedback.find(filter).lean();
  const positive = feedbacks.filter((f: any) => f.rating === "up").length;
  const negative = feedbacks.filter((f: any) => f.rating === "down").length;
  const total = positive + negative;

  return {
    score: total > 0 ? Math.round((positive / total) * 100) : 0,
    total,
    positive,
    negative,
  };
}

/**
 * Get overall quality score combining completeness and satisfaction.
 */
export async function getQualityScore(
  analysisType?: string,
  days = 30
): Promise<QualityScore> {
  const satisfaction = await scoreSatisfaction(analysisType, days);

  return {
    completeness: 0, // Needs actual analysis data to compute
    satisfaction: satisfaction.score,
    overall:
      satisfaction.total > 0
        ? satisfaction.score
        : 50, // Default when no feedback
    sampleSize: satisfaction.total,
  };
}

/**
 * Check if quality is below threshold and should trigger alert.
 */
export function shouldAlert(score: QualityScore, threshold = 60): boolean {
  return score.sampleSize >= 5 && score.overall < threshold;
}
