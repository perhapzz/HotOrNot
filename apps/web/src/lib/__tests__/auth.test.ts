import { hashPassword, verifyPassword, generateToken, verifyToken } from "../auth";

describe("auth", () => {
  describe("hashPassword + verifyPassword", () => {
    it("hashes and verifies correctly", async () => {
      const hash = await hashPassword("mypassword123");
      expect(hash).not.toBe("mypassword123");
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
      expect(await verifyPassword("mypassword123", hash)).toBe(true);
      expect(await verifyPassword("wrongpassword", hash)).toBe(false);
    });

    it("generates different hashes for same password", async () => {
      const h1 = await hashPassword("test");
      const h2 = await hashPassword("test");
      expect(h1).not.toBe(h2); // bcrypt salts differ
    });
  });

  describe("generateToken + verifyToken", () => {
    const payload = {
      userId: "abc123",
      email: "test@example.com",
      username: "testuser",
      role: "user",
    };

    it("generates a JWT string", () => {
      const token = generateToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature
    });

    it("verifies and returns payload", () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe("abc123");
      expect(decoded!.email).toBe("test@example.com");
      expect(decoded!.role).toBe("user");
    });

    it("returns null for invalid token", () => {
      expect(verifyToken("not.a.valid.token")).toBeNull();
      expect(verifyToken("")).toBeNull();
    });

    it("returns null for tampered token", () => {
      const token = generateToken(payload);
      const tampered = token.slice(0, -5) + "XXXXX";
      expect(verifyToken(tampered)).toBeNull();
    });

    it("rejects base64 fake tokens (old format)", () => {
      const fakeToken = Buffer.from(JSON.stringify(payload)).toString("base64");
      expect(verifyToken(fakeToken)).toBeNull();
    });
  });
});
