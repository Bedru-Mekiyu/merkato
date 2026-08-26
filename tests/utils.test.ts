import { describe, it, expect } from "vitest";
import { cn, joinedRow } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("skips falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("joinedRow", () => {
  it("returns the object when the join resolved to a single row", () => {
    const row = { full_name: "Ada" };
    expect(joinedRow<{ full_name: string }>(row)).toBe(row);
  });

  it("unwraps the first element when PostgREST returns an array", () => {
    expect(joinedRow<{ full_name: string }>([{ full_name: "Ada" }])).toEqual({
      full_name: "Ada",
    });
  });

  it("returns null for empty arrays", () => {
    expect(joinedRow<{ full_name: string }>([])).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(joinedRow(null)).toBeNull();
    expect(joinedRow(undefined)).toBeNull();
  });
});
