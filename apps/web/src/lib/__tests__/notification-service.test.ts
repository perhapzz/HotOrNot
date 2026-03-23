import { detectHotlistChanges, formatChangesMarkdown } from "../notification-service";

describe("notification-service", () => {
  describe("detectHotlistChanges", () => {
    const oldItems = [
      { title: "Item A", rank: 1 },
      { title: "Item B", rank: 2 },
      { title: "Item C", rank: 3 },
      { title: "Item D", rank: 15 },
    ];

    it("returns null when no changes", () => {
      const result = detectHotlistChanges("douyin", oldItems, [...oldItems]);
      expect(result).toBeNull();
    });

    it("detects new entries", () => {
      const newItems = [
        { title: "Item A", rank: 1 },
        { title: "NEW ITEM", rank: 2 },
        { title: "Item B", rank: 3 },
      ];
      const result = detectHotlistChanges("douyin", oldItems, newItems);
      expect(result).not.toBeNull();
      expect(result!.newItems).toHaveLength(1);
      expect(result!.newItems[0].title).toBe("NEW ITEM");
    });

    it("detects big rank movers (>=10 positions)", () => {
      const newItems = [
        { title: "Item A", rank: 1 },
        { title: "Item B", rank: 2 },
        { title: "Item C", rank: 3 },
        { title: "Item D", rank: 1 }, // moved from 15 to 1 = 14 positions
      ];
      const result = detectHotlistChanges("douyin", oldItems, newItems);
      expect(result).not.toBeNull();
      expect(result!.bigMovers).toHaveLength(1);
      expect(result!.bigMovers[0].title).toBe("Item D");
      expect(result!.bigMovers[0].oldRank).toBe(15);
      expect(result!.bigMovers[0].newRank).toBe(1);
    });

    it("ignores small rank changes (<10)", () => {
      const newItems = [
        { title: "Item A", rank: 3 }, // moved 2 positions
        { title: "Item B", rank: 1 },
        { title: "Item C", rank: 2 },
        { title: "Item D", rank: 12 }, // moved 3 positions
      ];
      const result = detectHotlistChanges("douyin", oldItems, newItems);
      expect(result).toBeNull();
    });

    it("returns null for empty inputs", () => {
      expect(detectHotlistChanges("douyin", [], oldItems)).toBeNull();
      expect(detectHotlistChanges("douyin", oldItems, [])).toBeNull();
    });
  });

  describe("formatChangesMarkdown", () => {
    it("formats new items", () => {
      const md = formatChangesMarkdown({
        platform: "douyin",
        newItems: [{ title: "Hot Topic", rank: 3 }],
        bigMovers: [],
      });
      expect(md).toContain("新上榜");
      expect(md).toContain("#3 Hot Topic");
    });

    it("formats big movers", () => {
      const md = formatChangesMarkdown({
        platform: "weibo",
        newItems: [],
        bigMovers: [{ title: "Rising", oldRank: 20, newRank: 1 }],
      });
      expect(md).toContain("排名大幅变动");
      expect(md).toContain("#20 → #1");
    });

    it("formats both together", () => {
      const md = formatChangesMarkdown({
        platform: "bilibili",
        newItems: [{ title: "New", rank: 5 }],
        bigMovers: [{ title: "Mover", oldRank: 30, newRank: 2 }],
      });
      expect(md).toContain("新上榜");
      expect(md).toContain("排名大幅变动");
    });
  });
});
