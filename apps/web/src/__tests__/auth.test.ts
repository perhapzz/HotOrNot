/**
 * Tests for auth.ts — token generation and verification
 */

// Set JWT_SECRET before importing
process.env.JWT_SECRET = "test-secret-for-auth-tests";

import { signToken, verifyToken, hashPassword, comparePassword } from "../lib/auth";

describe("Auth", () => {
  describe("signToken / verifyToken", () => {
    it("signs and verifies a valid token", () => {
      const payload = { userId: "user123", username: "testuser", role: "user" };
      const token = signToken(payload);

      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT format

      const verified = verifyToken(token);
      expect(verified).toBeTruthy();
      expect(verified.userId).toBe("user123");
      expect(verified.username).toBe("testuser");
    });

    it("returns null for invalid token", () => {
      const result = verifyToken("invalid.token.here");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = verifyToken("");
      expect(result).toBeNull();
    });
  });

  describe("hashPassword / comparePassword", () => {
    it("hashes and verifies password", async () => {
      const password = "MySecurePassword123!";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true); // bcrypt format

      const match = await comparePassword(password, hash);
      expect(match).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await hashPassword("correct");
      const match = await comparePassword("wrong", hash);
      expect(match).toBe(false);
    });
  });
});
