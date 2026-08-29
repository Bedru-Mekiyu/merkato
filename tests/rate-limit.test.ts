import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-1`;
    const res1 = rateLimit(key, 5, 10000);
    expect(res1.ok).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = rateLimit(key, 5, 10000);
    expect(res2.ok).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("blocks requests that exceed the limit", () => {
    const key = `test-${Date.now()}-2`;
    // Consume limit of 2
    rateLimit(key, 2, 10000);
    rateLimit(key, 2, 10000);

    const blocked = rateLimit(key, 2, 10000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
