import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders headings with kb classes", () => {
    const html = renderMarkdown("# Hello\n## Sub");
    expect(html).toContain('<h1 class="kb-h1">Hello</h1>');
    expect(html).toContain('<h2 class="kb-h2">Sub</h2>');
  });

  it("renders bold, italic and inline code", () => {
    const html = renderMarkdown("**bold** *em* `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
    expect(html).toContain('<code class="kb-inline-code">code</code>');
  });

  it("escapes HTML to prevent XSS", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML inside code blocks", () => {
    const html = renderMarkdown("```\n<img src=x onerror=alert(1)>\n```");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain('class="kb-code-block"');
  });

  it("renders unordered lists", () => {
    const html = renderMarkdown("- one\n- two");
    expect(html).toContain('<ul class="kb-ul">');
    expect((html.match(/<li>/g) ?? []).length).toBe(2);
  });

  it("renders ordered lists", () => {
    const html = renderMarkdown("1. first\n2. second");
    expect(html).toContain('<ol class="kb-ol">');
    expect((html.match(/<li>/g) ?? []).length).toBe(2);
  });

  it("renders links with safe rel attributes", () => {
    const html = renderMarkdown("[Docs](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("closes open lists at end of input", () => {
    const html = renderMarkdown("- item");
    expect(html.trimEnd().endsWith("</ul>")).toBe(true);
  });
});
