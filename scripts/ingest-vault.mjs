#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const vaultPath = process.argv[2];
if (!vaultPath) {
  console.error("Usage: npm run ingest:vault -- /absolute/path/to/obsidian-vault");
  process.exit(1);
}

const resolvedVault = path.resolve(vaultPath);
if (!fs.existsSync(resolvedVault)) {
  console.error(`Vault path not found: ${resolvedVault}`);
  process.exit(1);
}

const projectRoot = path.resolve(process.cwd());
const notesOutDir = path.join(projectRoot, "content", "notes");
const indexOutPath = path.join(projectRoot, "content", "index.json");

fs.rmSync(notesOutDir, { recursive: true, force: true });
fs.mkdirSync(notesOutDir, { recursive: true });

/** @type {Array<{
 * id: string;
 * slug: string;
 * title: string;
 * description?: string;
 * type?: string;
 * createdAt?: string;
 * tags?: string[];
 * stage?: string[];
 * notebook: string;
 * relativePath: string;
 * links: string[];
 * backlinks: Array<{fromSlug:string;fromTitle:string;context:string;hoverContext?:string}>;
 * rawContent: string;
 * htmlContent: string;
 * }>} */
const notes = [];

/** @type {Map<string, string>} */
const titleToSlug = new Map();
/** @type {Map<string, string>} */
const pathToSlug = new Map();

const SKIP_DIRS = new Set([".obsidian", ".trash", ".git"]);

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9/\-\s_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\/+/g, "/");
}

function sanitizeSegment(input) {
  return input.replace(/[^a-zA-Z0-9 ._-]/g, "").trim();
}

function findMarkdownFiles(dir, relBase = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      if (!SKIP_DIRS.has(entry.name)) {
        continue;
      }
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
    }

    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relative = relBase ? path.join(relBase, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, relative));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push({ fullPath, relative });
    }
  }

  return files;
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n") && !markdown.startsWith("---\r\n")) {
    return { frontmatter: {}, body: markdown };
  }

  const lines = markdown.split(/\r?\n/);
  if (lines[0].trim() !== "---") {
    return { frontmatter: {}, body: markdown };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, body: markdown };
  }

  const frontmatter = {};
  const fmLines = lines.slice(1, endIndex);

  for (let i = 0; i < fmLines.length; i += 1) {
    const line = fmLines[i];
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      continue;
    }

    const key = keyMatch[1];
    const inlineValue = keyMatch[2]?.trim() || "";

    if (inlineValue) {
      frontmatter[key] = inlineValue.replace(/^['"]|['"]$/g, "");
      continue;
    }

    const listValues = [];
    let j = i + 1;
    while (j < fmLines.length) {
      const listMatch = fmLines[j].match(/^\s*-\s+(.+)$/);
      if (!listMatch) {
        break;
      }
      listValues.push(listMatch[1].trim().replace(/^['"]|['"]$/g, ""));
      j += 1;
    }

    if (listValues.length > 0) {
      frontmatter[key] = listValues;
      i = j - 1;
    } else {
      frontmatter[key] = "";
    }
  }

  const body = lines.slice(endIndex + 1).join("\n").trimStart();
  return { frontmatter, body };
}

function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function makeNoteHref(slug) {
  return `/?note=${encodeURIComponent(slug)}`;
}

function isExternalHref(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("mailto:");
}

function normalizeLinkValue(value) {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .split("#")[0]
    .replace(/^\/+/, "");
}

function resolveNoteSlug(value, fromRelativePath = "") {
  const normalized = normalizeLinkValue(value);
  if (!normalized) {
    return undefined;
  }

  const fromDir = path.posix.dirname(fromRelativePath.toLowerCase());
  const resolvedRelative = normalized.startsWith(".")
    ? path.posix.normalize(path.posix.join(fromDir, normalized))
    : normalized.toLowerCase();

  const basename = path.posix.basename(normalized.toLowerCase());

  return (
    pathToSlug.get(normalized.toLowerCase()) ||
    pathToSlug.get(resolvedRelative) ||
    titleToSlug.get(normalized.toLowerCase()) ||
    titleToSlug.get(basename)
  );
}

function inlineMarkdownToHtml(input, fromRelativePath) {
  return input
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      const trimmedHref = href.trim();
      if (!trimmedHref || trimmedHref.startsWith("#")) {
        return `<a href="${trimmedHref}" class="underline">${label}</a>`;
      }
      if (isExternalHref(trimmedHref)) {
        return `<a href="${trimmedHref}" class="underline">${label}</a>`;
      }

      const targetSlug = resolveNoteSlug(trimmedHref, fromRelativePath);
      if (!targetSlug) {
        return `<a href="${trimmedHref}" class="underline">${label}</a>`;
      }

      return `<a href="${makeNoteHref(targetSlug)}" class="underline decoration-2 underline-offset-2">${label}</a>`;
    })
    .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, p1, _p2, p3) => {
      const label = p3 || p1;
      const targetSlug = resolveNoteSlug(p1, fromRelativePath);
      if (!targetSlug) {
        return `<span class="rounded bg-[var(--muted)] px-1">${label}</span>`;
      }
      return `<a href="${makeNoteHref(targetSlug)}" class="rounded bg-[var(--muted)] px-1 underline decoration-2 underline-offset-2">${label}</a>`;
    });
}

function renderQuoteLines(lines, fromRelativePath) {
  const paragraphs = [];
  let current = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      continue;
    }
    current.push(line.trim());
  }

  if (current.length) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs
    .map((text) => `<p>${inlineMarkdownToHtml(escapeHtml(text), fromRelativePath)}</p>`)
    .join("");
}

function renderQuoteBlock(rawLines, fromRelativePath) {
  const lines = rawLines.map((line) => line.replace(/^\s*>\s?/, ""));
  const firstLine = lines[0]?.trim() || "";
  const calloutMatch = firstLine.match(/^\[!([a-z0-9_-]+)([+-])?\]\s*(.*)$/i);

  if (!calloutMatch) {
    return `<blockquote class="dg-quote">${renderQuoteLines(lines, fromRelativePath)}</blockquote>`;
  }

  const calloutType = calloutMatch[1].toLowerCase();
  const calloutTitle = calloutMatch[3]?.trim() || calloutType[0].toUpperCase() + calloutType.slice(1);
  const contentLines = [...lines];
  contentLines[0] = "";

  return `<aside class="dg-callout dg-callout-${calloutType}">
    <p class="dg-callout-title">${inlineMarkdownToHtml(escapeHtml(calloutTitle), fromRelativePath)}</p>
    <div class="dg-callout-content">${renderQuoteLines(contentLines, fromRelativePath)}</div>
  </aside>`;
}

function renderCodeBlock(lines, language) {
  const lang = (language || "").toLowerCase();
  const escapedCode = escapeHtml(lines.join("\n"));
  const langClass = lang ? ` class="language-${lang}"` : "";
  const langAttr = lang ? ` data-language="${escapeHtml(lang)}"` : "";
  return `<pre class="dg-code-block"${langAttr}><code${langClass}>${escapedCode}</code></pre>`;
}

function markdownToHtml(markdown, fromRelativePath) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockLines = [];
  
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inCodeBlock) {
      if (trimmed.startsWith("```")) {
        html.push(renderCodeBlock(codeBlockLines, codeBlockLanguage));
        inCodeBlock = false;
        codeBlockLanguage = "";
        codeBlockLines = [];
        continue;
      }

      codeBlockLines.push(line);
      continue;
    }

    if (trimmed.startsWith("```")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      inCodeBlock = true;
      codeBlockLanguage = trimmed.slice(3).trim();
      codeBlockLines = [];
      continue;
    }

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      } else {
        html.push('<div class="dg-paragraph-break" aria-hidden="true"></div>');
      }
      continue;
    }

    if (trimmed === "---") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push('<hr class="dg-divider" />');
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${inlineMarkdownToHtml(escapeHtml(trimmed.slice(4)), fromRelativePath)}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inlineMarkdownToHtml(escapeHtml(trimmed.slice(3)), fromRelativePath)}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${inlineMarkdownToHtml(escapeHtml(trimmed.slice(2)), fromRelativePath)}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdownToHtml(escapeHtml(trimmed.slice(2)), fromRelativePath)}</li>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }

      const quoteLines = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith(">")) {
        quoteLines.push(lines[j]);
        j += 1;
      }

      html.push(renderQuoteBlock(quoteLines, fromRelativePath));
      i = j - 1;
      continue;
    }

    html.push(`<p>${inlineMarkdownToHtml(escapeHtml(trimmed), fromRelativePath)}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  if (inCodeBlock) {
    html.push(renderCodeBlock(codeBlockLines, codeBlockLanguage));
  }

  return html.join("\n");
}

function extractLinks(markdown) {
  const links = [];

  const wikiRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  for (const match of markdown.matchAll(wikiRegex)) {
    const value = match[1]?.trim();
    if (value) {
      links.push({ value, index: match.index ?? 0, source: "wiki" });
    }
  }

  const mdRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of markdown.matchAll(mdRegex)) {
    const value = match[1]?.trim();
    if (!value || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("#")) {
      continue;
    }
    links.push({ value, index: match.index ?? 0, source: "md" });
  }

  return links;
}

function cleanContextText(input) {
  return input
    .trim()
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+/g, " ");
}

function clipAround(text, index, maxLen = 220) {
  if (text.length <= maxLen) {
    return text;
  }

  const half = Math.floor(maxLen / 2);
  const start = Math.max(0, index - half);
  const end = Math.min(text.length, start + maxLen);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function contextSnippet(markdown, startIndex) {
  if (!markdown) {
    return "";
  }

  const lineStart = markdown.lastIndexOf("\n", Math.max(0, startIndex - 1)) + 1;
  const rawLineEnd = markdown.indexOf("\n", startIndex);
  const lineEnd = rawLineEnd === -1 ? markdown.length : rawLineEnd;
  const line = markdown.slice(lineStart, lineEnd);
  const cleanedLine = cleanContextText(line);

  if (!cleanedLine) {
    return "";
  }

  const relativeIndex = Math.max(0, Math.min(cleanedLine.length - 1, startIndex - lineStart));

  const sentenceBoundary = /[.!?]/;
  let sentenceStart = 0;
  for (let i = relativeIndex; i >= 0; i -= 1) {
    if (sentenceBoundary.test(cleanedLine[i])) {
      sentenceStart = i + 1;
      break;
    }
  }

  let sentenceEnd = cleanedLine.length;
  for (let i = relativeIndex; i < cleanedLine.length; i += 1) {
    if (sentenceBoundary.test(cleanedLine[i])) {
      sentenceEnd = i + 1;
      break;
    }
  }

  const sentence = cleanContextText(cleanedLine.slice(sentenceStart, sentenceEnd));
  if (sentence.length >= 40 && sentence.length <= 260) {
    return sentence;
  }

  return clipAround(cleanedLine, relativeIndex, 220);
}

function sentenceStart(text, index) {
  for (let i = Math.max(0, index); i >= 0; i -= 1) {
    if (/[.!?\n]/.test(text[i])) {
      return i + 1;
    }
  }
  return 0;
}

function sentenceEnd(text, index) {
  for (let i = Math.max(0, index); i < text.length; i += 1) {
    if (/[.!?\n]/.test(text[i])) {
      return i + 1;
    }
  }
  return text.length;
}

function sentenceAt(text, index) {
  const start = sentenceStart(text, index);
  const end = sentenceEnd(text, index);
  return cleanContextText(text.slice(start, end));
}

function expandedContext(markdown, startIndex) {
  if (!markdown) {
    return "";
  }

  const paragraphStartMarker = markdown.lastIndexOf("\n\n", Math.max(0, startIndex - 1));
  const paragraphStart = paragraphStartMarker === -1 ? 0 : paragraphStartMarker + 2;
  const paragraphEndMarker = markdown.indexOf("\n\n", startIndex);
  const paragraphEnd = paragraphEndMarker === -1 ? markdown.length : paragraphEndMarker;

  const rawParagraph = markdown.slice(paragraphStart, paragraphEnd);
  const paragraph = cleanContextText(rawParagraph);

  if (paragraph.length >= 80) {
    const paragraphRelativeIndex = Math.max(
      0,
      Math.min(paragraph.length - 1, startIndex - paragraphStart),
    );
    return clipAround(paragraph, paragraphRelativeIndex, 560);
  }

  const currentStart = sentenceStart(markdown, startIndex);
  const currentEnd = sentenceEnd(markdown, startIndex);

  const previousTwo = sentenceAt(markdown, sentenceStart(markdown, currentStart - 1));
  const previousOne = sentenceAt(markdown, currentStart - 1);
  const current = sentenceAt(markdown, startIndex);
  const nextOne = sentenceAt(markdown, currentEnd + 1);
  const nextTwo = sentenceAt(markdown, sentenceEnd(markdown, currentEnd + 1) + 1);

  const joined = [previousTwo, previousOne, current, nextOne, nextTwo].filter(Boolean).join(" ");
  return clipAround(cleanContextText(joined), Math.floor(joined.length / 2), 560);
}

const markdownFiles = findMarkdownFiles(resolvedVault);

for (const file of markdownFiles) {
  const sourceContent = fs.readFileSync(file.fullPath, "utf8");
  const { frontmatter, body } = parseFrontmatter(sourceContent);
  const posixRelative = file.relative.split(path.sep).join("/");
  const segments = posixRelative.split("/").map(sanitizeSegment).filter(Boolean);

  const notebook = segments[0] || "General";
  const titleFallback = path.basename(posixRelative, ".md");
  const title =
    typeof frontmatter.title === "string" && frontmatter.title.trim()
      ? frontmatter.title.trim()
      : titleFallback;
  const slug = slugify(posixRelative);

  const outPath = path.join(notesOutDir, ...segments);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, sourceContent, "utf8");

  const note = {
    id: slug,
    slug,
    title,
    description: typeof frontmatter.description === "string" ? frontmatter.description : undefined,
    type: typeof frontmatter.type === "string" ? frontmatter.type : undefined,
    createdAt: typeof frontmatter.timestamp === "string" ? frontmatter.timestamp : undefined,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    stage: Array.isArray(frontmatter.stage)
      ? frontmatter.stage
      : typeof frontmatter.stage === "string" && frontmatter.stage
        ? [frontmatter.stage]
        : [],
    notebook,
    relativePath: posixRelative,
    links: [],
    backlinks: [],
    rawContent: body,
    htmlContent: "",
  };

  notes.push(note);
  titleToSlug.set(title.toLowerCase(), slug);
  titleToSlug.set(titleFallback.toLowerCase(), slug);
  pathToSlug.set(slug, slug);
  pathToSlug.set(posixRelative.toLowerCase().replace(/\.md$/i, ""), slug);
}

for (const note of notes) {
  const extracted = extractLinks(note.rawContent);
  const unique = new Set();

  for (const link of extracted) {
    const targetSlug = resolveNoteSlug(link.value, note.relativePath);

    if (!targetSlug || targetSlug === note.slug || unique.has(targetSlug)) {
      continue;
    }

    unique.add(targetSlug);
    note.links.push(targetSlug);

    const target = notes.find((n) => n.slug === targetSlug);
    if (!target) {
      continue;
    }

    target.backlinks.push({
      fromSlug: note.slug,
      fromTitle: note.title,
      context: contextSnippet(note.rawContent, link.index),
      hoverContext: expandedContext(note.rawContent, link.index),
    });
  }
}

for (const note of notes) {
  note.htmlContent = markdownToHtml(note.rawContent, note.relativePath);
}

const notebooks = Array.from(new Set(notes.map((n) => n.notebook))).sort((a, b) =>
  a.localeCompare(b),
);

const output = {
  generatedAt: new Date().toISOString(),
  notebooks,
  notes: notes.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
};

fs.writeFileSync(indexOutPath, JSON.stringify(output, null, 2), "utf8");

console.log(`Parsed ${notes.length} notes from ${resolvedVault}`);
console.log(`Wrote markdown files to ${notesOutDir}`);
console.log(`Wrote index to ${indexOutPath}`);
