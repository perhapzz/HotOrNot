/**
 * Tests for quality-scorer.ts
 */

import { calculateQualityScore } from "../lib/quality-scorer";

describe("QualityScorer", () => {
  it("returns high score for complete analysis with good data", () => {
    const result = calculateQualityScore({
      hasOverallScore: true,
      hasSuggestions: true,
      suggestionCount: 5,
      hasSummary: true,
      hasScores: true,
      dimensionCount: 4,
      responseTime: 2000,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns low score for missing data", () => {
    const result = calculateQualityScore({
      hasOverallScore: false,
      hasSuggestions: false,
      suggestionCount: 0,
      hasSummary: false,
      hasScores: false,
      dimensionCount: 0,
      responseTime: 10000,
    });

    expect(result.score).toBeLessThan(50);
  });

  it("penalizes slow response time", () => {
    const fast = calculateQualityScore({
      hasOverallScore: true,
      hasSuggestions: true,
      suggestionCount: 3,
      hasSummary: true,
      hasScores: true,
      dimensionCount: 3,
      responseTime: 1000,
    });

    const slow = calculateQualityScore({
      hasOverallScore: true,
      hasSuggestions: true,
      suggestionCount: 3,
      hasSummary: true,
      hasScores: true,
      dimensionCount: 3,
      responseTime: 15000,
    });

    expect(fast.score).toBeGreaterThan(slow.score);
  });

  it("score is between 0 and 100", () => {
    const result = calculateQualityScore({
      hasOverallScore: true,
      hasSuggestions: true,
      suggestionCount: 10,
      hasSummary: true,
      hasScores: true,
      dimensionCount: 6,
      responseTime: 500,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
