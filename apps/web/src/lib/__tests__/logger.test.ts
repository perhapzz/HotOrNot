import { logger } from "../logger";

describe("logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exports a default logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("info logs without throwing", () => {
    expect(() => logger.info("test message")).not.toThrow();
  });

  it("warn logs without throwing", () => {
    expect(() => logger.warn("warning message")).not.toThrow();
  });

  it("error logs without throwing", () => {
    expect(() => logger.error("error message")).not.toThrow();
  });

  it("info with data logs without throwing", () => {
    expect(() => logger.info("test", { key: "value" })).not.toThrow();
  });

  it("error with data logs without throwing", () => {
    expect(() => logger.error("error", { code: 500 })).not.toThrow();
  });
});
