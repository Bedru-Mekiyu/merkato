/**
 * A small, dependency-free Markdown -> HTML renderer.
 *
 * We deliberately avoid pulling in a Markdown library here since this
 * project's dependencies can't be installed/verified in the build
 * environment that generated it. This covers the common cases editors
 * actually use: headings, bold/italic, inline code, fenced code blocks,
 * unordered/ordered lists, links, and paragraphs. It is not a full CommonMark
 * implementation — if you need that, swap this out for `react-markdown`
 * once you can `npm install` locally.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code class="kb-inline-code">$1</code>');
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = sanitizeLink(href);
    if (!safeHref) return label;
    return `<a href="${safeHref}" class="kb-link" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return out;
}

function sanitizeLink(href: string): string | null {
  const normalized = href.trim();
  if (/^(https?:|mailto:)/i.test(normalized)) return normalized.replace(/"/g, "&quot;");
  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized.replace(/"/g, "&quot;");
  }
  return null;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlParts: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) {
      htmlParts.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      htmlParts.push("</ol>");
      inOl = false;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      closeLists();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      htmlParts.push(
        `<pre class="kb-code-block"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      );
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level} class="kb-h${level}">${renderInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!inUl) {
        closeLists();
        htmlParts.push('<ul class="kb-ul">');
        inUl = true;
      }
      htmlParts.push(`<li>${renderInline(ulMatch[1])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inOl) {
        closeLists();
        htmlParts.push('<ol class="kb-ol">');
        inOl = true;
      }
      htmlParts.push(`<li>${renderInline(olMatch[1])}</li>`);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeLists();
      i++;
      continue;
    }

    // Paragraph
    closeLists();
    htmlParts.push(`<p class="kb-p">${renderInline(line)}</p>`);
    i++;
  }

  closeLists();
  return htmlParts.join("\n");
}
