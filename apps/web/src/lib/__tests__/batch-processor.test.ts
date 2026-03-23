import { generateJobId } from "../batch-processor";

describe("batch-processor", () => {
  describe("generateJobId", () => {
    it("generates a string starting with batch_", () => {
      const id = generateJobId();
      expect(id).toMatch(/^batch_\d+_[a-z0-9]+$/);
    });

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateJobId()));
      expect(ids.size).toBe(100);
    });

    it("contains a timestamp component", () => {
      const before = Date.now();
      const id = generateJobId();
      const after = Date.now();
      const ts = parseInt(id.split("_")[1], 10);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });
});
