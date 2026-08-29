import { describe, it, expect } from "vitest";
import { sanitizeSearchQuery } from "@/lib/search";

describe("sanitizeSearchQuery", () => {
  it("removes PostgREST reserved characters", () => {
    expect(sanitizeSearchQuery("acme, (corp)%\\")).toBe("acme corp");
  });

  it("trims whitespace and handles clean queries", () => {
    expect(sanitizeSearchQuery("  linear sprint  ")).toBe("linear sprint");
  });
});
