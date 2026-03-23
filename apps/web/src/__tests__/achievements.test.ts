/**
 * Tests for achievements.ts — definition integrity
 */

import { ACHIEVEMENTS } from "../lib/achievements";

describe("Achievements", () => {
  it("has at least 8 achievements defined", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(8);
  });

  it("all achievements have required fields", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.emoji).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(typeof a.check).toBe("function");
    }
  });

  it("achievement IDs are unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("each achievement has an emoji", () => {
    for (const a of ACHIEVEMENTS) {
      // Emoji should be non-empty string
      expect(a.emoji.length).toBeGreaterThan(0);
    }
  });
});
