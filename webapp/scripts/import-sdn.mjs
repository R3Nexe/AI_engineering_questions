#!/usr/bin/env node
// import-sdn.mjs — import liquidslr/system-design-notes into webapp/public/chapters/
// Usage (from webapp/): node scripts/import-sdn.mjs /tmp/sdn/liquidslr-system-design-notes-9d83887

import {
  readFileSync, writeFileSync, mkdirSync, copyFileSync,
  existsSync, readdirSync, rmSync,
} from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEBAPP_DIR = resolve(__dirname, '..');
const PUBLIC_CHAPTERS = join(WEBAPP_DIR, 'public', 'chapters');
const EXISTING_INDEX = join(PUBLIC_CHAPTERS, 'index.json');

// ─── CLI ─────────────────────────────────────────────────────────────────────

const srcArg = process.argv[2];
if (!srcArg) {
  console.error('Usage: node scripts/import-sdn.mjs <source-dir>');
  process.exit(1);
}
const SOURCE_DIR = resolve(srcArg);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** "04. Rate Limiter" → "ch04-rate-limiter" */
function dirToSlug(dirName) {
  const m = dirName.match(/^(\d+)\.\s+(.*)/);
  if (!m) throw new Error(`Cannot parse dir name: "${dirName}"`);
  const num = m[1].padStart(2, '0');
  const title = m[2].trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `ch${num}-${title}`;
}

/** Parse "# Chapter 4: Design a Rate Limiter" → "Design a Rate Limiter" */
function parseH1Title(line) {
  const m = line.match(/^#\s+Chapter\s+\d+:?\s*(.*)/i);
  return m ? m[1].trim() : null;
}

/** Parse title from root Readme chapter list for chapter N */
function parseTitleFromRootReadme(rootText, num) {
  for (const line of rootText.split('\n')) {
    const m = line.match(/\*\s+\[Chapter\s+(\d+)\s*[-–]\s*([^\]]+)\]/i);
    if (m && parseInt(m[1]) === num) return m[2].trim();
  }
  return null;
}

/** "token-bucket.png" → "Token Bucket" */
function filenameToAlt(filename) {
  return basename(filename, '.png')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Extract src and alt from img attribute string */
function parseImgAttrs(attrs) {
  const srcM = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
  const altM = attrs.match(/alt\s*=\s*["']([^"']+)["']/i);
  return {
    src: srcM ? srcM[1] : '',
    alt: altM ? altM[1] : '',
  };
}

/** "./images/foo.png" → "foo.png" */
function srcToFilename(src) {
  return src.replace(/^.*[/\\]/, '');
}

/** Apply transform ONLY outside fenced code blocks (``` ... ```). */
function applyOutsideCodeBlocks(content, transform) {
  const re = /^```[^\n]*\n[\s\S]*?^```[ \t]*/gm;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(content)) !== null) {
    parts.push(transform(content.slice(last, m.index)));
    parts.push(m[0]); // code block verbatim
    last = m.index + m[0].length;
  }
  parts.push(transform(content.slice(last)));
  return parts.join('');
}

/** Apply transform ONLY outside fenced code blocks AND inline code spans. */
function applyOutsideAllCode(content, transform) {
  return applyOutsideCodeBlocks(content, chunk => {
    // Within a non-fence chunk, split on inline code spans `...`
    const re = /`[^`\n]+`/g;
    const segs = [];
    let last = 0;
    let m;
    while ((m = re.exec(chunk)) !== null) {
      segs.push(transform(chunk.slice(last, m.index)));
      segs.push(m[0]); // inline code verbatim
      last = m.index + m[0].length;
    }
    segs.push(transform(chunk.slice(last)));
    return segs.join('');
  });
}


/** Strip markdown syntax for plain-text extraction */
function stripMd(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, s => s.slice(1, -1))
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Count words in cleaned markdown */
function wordCount(text) {
  const plain = stripMd(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/** Extract summary: first real paragraph, ≤ 2 sentences, plain text */
function extractSummary(cleaned) {
  const lines = cleaned.split('\n');
  let inFence = false;
  const paraLines = [];
  let collecting = false;

  for (const line of lines) {
    if (line.startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;
    const t = line.trim();
    if (!t) {
      if (collecting && paraLines.length > 0) break;
      continue;
    }
    // Skip headings, images, bullets, rules
    if (/^#{1,6}\s/.test(t) || t.startsWith('!') || /^[-*+]\s/.test(t) || t === '---' || t === '***') continue;
    collecting = true;
    paraLines.push(t);
  }

  let summary = paraLines.join(' ')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`[^`]+`/g, s => s.slice(1, -1))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Keep ≤ 2 sentences
  const sentenceRe = /[^.!?]*[.!?]+(\s|$)/g;
  const sentences = [];
  let sm;
  while ((sm = sentenceRe.exec(summary)) !== null) sentences.push(sm[0].trim());
  if (sentences.length >= 2) {
    summary = sentences.slice(0, 2).join(' ').trim();
  }

  return summary;
}

// ─── MARKDOWN PROCESSING ─────────────────────────────────────────────────────

function processMarkdown(content, slug, numToSlug) {
  const referencedImages = new Set();

  // ── Collect image positions from original content ──────────────────────────

  // Record: {pos, end, filename, alt}
  const imgRefs = [];

  // Pattern 1: wrapper (div/p/center) on one line, img on next, close on third
  // Also handles single-line wrappers like <div ...><img .../></div>
  const wrapRe = /[ \t]*<(div|p|center)(?:\s[^>]*)?>[ \t]*\n?[ \t]*<img\s([^>]*?)\/?>[ \t]*\n?[ \t]*<\/\1>[ \t]*/gi;
  let m;
  while ((m = wrapRe.exec(content)) !== null) {
    const { src, alt } = parseImgAttrs(m[2]);
    if (!src) continue;
    imgRefs.push({ pos: m.index, end: m.index + m[0].length, filename: srcToFilename(src), alt });
  }

  // Pattern 2: standalone HTML img (not already covered by a wrapper match)
  const standaloneRe = /[ \t]*<img\s([^>]*?)\/?>[ \t]*/gi;
  while ((m = standaloneRe.exec(content)) !== null) {
    const covered = imgRefs.some(r => m.index >= r.pos && m.index < r.end);
    if (covered) continue;
    const { src, alt } = parseImgAttrs(m[1]);
    if (!src) continue;
    imgRefs.push({ pos: m.index, end: m.index + m[0].length, filename: srcToFilename(src), alt });
  }

  // Pattern 3: markdown image ![]()
  const mdImgRe = /!\[([^\]]*)\]\(\.\/images\/([^\s)]+)\)/g;
  while ((m = mdImgRe.exec(content)) !== null) {
    imgRefs.push({ pos: m.index, end: m.index + m[0].length, filename: m[2], alt: m[1] });
  }

  // Sort by position
  imgRefs.sort((a, b) => a.pos - b.pos);

  // ── Assign sections: nearest preceding ## or ### heading ───────────────────

  let charPos = 0;
  let inFenceState = false;
  const origLines = content.split('\n');
  const headingPositions = []; // {charPos, depth, text}

  for (const line of origLines) {
    if (line.startsWith('```')) inFenceState = !inFenceState;
    if (!inFenceState) {
      const hm = line.match(/^(#{2,3})\s+(.*)/);
      if (hm) {
        headingPositions.push({
          charPos,
          depth: hm[1].length,
          text: hm[2].trim().replace(/\*{1,2}/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
        });
      }
    }
    charPos += line.length + 1;
  }

  function nearestSection(pos) {
    let section = '';
    for (const h of headingPositions) {
      if (h.charPos > pos) break;
      section = h.text;
    }
    return section;
  }

  // Build figures array (using original positions for section lookup)
  const figures = imgRefs.map(img => ({
    src: `/chapters/${slug}/images/${encodeURIComponent(img.filename)}`,
    alt: img.alt || filenameToAlt(img.filename),
    section: nearestSection(img.pos),
  }));

  // ── Replace images in content (from end to start, to preserve positions) ───

  let result = content;
  const sortedDesc = [...imgRefs].sort((a, b) => b.pos - a.pos);
  for (const img of sortedDesc) {
    const alt = img.alt || filenameToAlt(img.filename);
    const encoded = encodeURIComponent(img.filename);
    const mdImg = `\n![${alt}](/chapters/${slug}/images/${encoded})\n`;
    result = result.slice(0, img.pos) + mdImg + result.slice(img.end);
    referencedImages.add(img.filename);
  }

  // ── Remove leftover wrapper tags, convert <b> to ** ─────────────────────
  // Applied ONLY outside fenced code blocks and inline code spans to avoid
  // corrupting content like `<post_id, user_id>` or JSON with <b> tags.
  // <p> uses (?:\s|>) lookahead so it won't match <Price>, <post_id> etc.

  result = applyOutsideAllCode(result, text => text
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .replace(/<p(?=[\s>])[^>]*>|<\/p>/gi, '')
    .replace(/<center[^>]*>|<\/center>/gi, '')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<b>/gi, '**')
    .replace(/<\/b>/gi, '**')
  );

  // ── Drop the first H1 ─────────────────────────────────────────────────────

  result = result.replace(/^#\s+Chapter\s+\d+:?[^\n]*\n?/im, '');

  // ── Rewrite relative chapter links ../NN. Name/ → /chapters/<slug> ────────

  result = result.replace(/\]\(\.\.\/([^)]+)\)/g, (match, target) => {
    // Remove trailing slash and decode URL encoding
    const decoded = decodeURIComponent(target.replace(/\/$/, '').trim());
    // Try "NN. Name" format
    let dm = decoded.match(/^(\d+)\.\s+(.*)/);
    if (dm) {
      try {
        const linkSlug = dirToSlug(`${dm[1]}. ${dm[2]}`);
        return `](/chapters/${linkSlug})`;
      } catch {
        return match;
      }
    }
    // Try "chapterNN" or "chNN" format
    dm = decoded.match(/^(?:chapter|ch)(\d+)$/i);
    if (dm) {
      const n = parseInt(dm[1]);
      const linkSlug = numToSlug.get(n);
      if (linkSlug) return `](/chapters/${linkSlug})`;
    }
    return match;
  });

  // ── Escape angle-bracket placeholders outside code blocks/spans ───────────
  // Rules (per contract):
  //   • Only '<' immediately followed by [A-Za-z/] (looks like an HTML tag)
  //   • '<' before digit/space (e.g. <10 KB) left as-is
  //   • applyOutsideAllCode ensures we never touch fenced blocks or inline spans

  result = applyOutsideAllCode(result, text =>
    text.replace(/<([A-Za-z/][^>\n]*)>/g, (_, inner) => `&lt;${inner}&gt;`)
  );

  // ── Clean up excessive blank lines ────────────────────────────────────────

  result = result.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  // ── Extract headings (depth 2-3) from cleaned content ────────────────────

  const headings = [];
  let inFenceFinal = false;
  for (const line of result.split('\n')) {
    if (line.startsWith('```')) { inFenceFinal = !inFenceFinal; continue; }
    if (inFenceFinal) continue;
    const hm = line.match(/^(#{2,3})\s+(.*)/);
    if (hm) {
      headings.push({
        depth: hm[1].length,
        text: hm[2].trim()
          .replace(/\*{1,2}/g, '')
          .replace(/`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      });
    }
  }

  const wc = wordCount(result);
  const summary = extractSummary(result);

  return { cleaned: result, figures, headings, summary, wordCount: wc, referencedImages };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\nImporting from: ${SOURCE_DIR}`);
console.log(`Output to:      ${PUBLIC_CHAPTERS}\n`);

// Load root Readme for title fallback
const rootReadme = readFileSync(join(SOURCE_DIR, 'Readme.md'), 'utf8');

// Load existing index.json to preserve concepts arrays
let existingConcepts = {};
if (existsSync(EXISTING_INDEX)) {
  try {
    const existing = JSON.parse(readFileSync(EXISTING_INDEX, 'utf8'));
    for (const ch of existing.chapters ?? []) {
      if (ch.slug && Array.isArray(ch.concepts) && ch.concepts.length > 0) {
        existingConcepts[ch.slug] = ch.concepts;
      }
    }
    console.log(`Preserved concepts from ${Object.keys(existingConcepts).length} existing chapter(s).`);
  } catch {
    console.warn('Warning: Could not parse existing index.json; concepts will be reset to [].');
  }
}

// Clear output directory (preserve root index.json if it exists, we'll overwrite it)
if (existsSync(PUBLIC_CHAPTERS)) {
  // Only delete chapter subdirs, not the root index.json itself
  for (const entry of readdirSync(PUBLIC_CHAPTERS, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      rmSync(join(PUBLIC_CHAPTERS, entry.name), { recursive: true, force: true });
    }
  }
}
mkdirSync(PUBLIC_CHAPTERS, { recursive: true });

// Enumerate chapter directories
const chapterDirs = readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^\d+\./.test(e.name))
  .sort((a, b) => {
    const na = parseInt(a.name), nb = parseInt(b.name);
    return na - nb;
  });

if (chapterDirs.length !== 28) {
  console.warn(`Warning: Expected 28 chapter dirs, found ${chapterDirs.length}`);
}

// Build number→slug map for link rewriting
const numToSlug = new Map();
for (const d of chapterDirs) {
  const num = parseInt(d.name);
  numToSlug.set(num, dirToSlug(d.name));
}

// Process each chapter
const chapters = [];
const perChapterStats = [];
let totalCopied = 0;
const missingImages = [];

for (const dirEntry of chapterDirs) {
  const dirName = dirEntry.name;
  const num = parseInt(dirName);
  const slug = dirToSlug(dirName);
  const volume = num <= 15 ? 1 : 2;
  const chSrcDir = join(SOURCE_DIR, dirName);

  // Find readme
  let readmePath;
  for (const fn of ['Readme.md', 'README.md']) {
    const p = join(chSrcDir, fn);
    if (existsSync(p)) { readmePath = p; break; }
  }
  if (!readmePath) {
    console.error(`ERROR: No readme found in ${dirName}`);
    process.exit(1);
  }

  const raw = readFileSync(readmePath, 'utf8');

  // Parse title
  let title = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('#') && !line.startsWith('##')) {
      title = parseH1Title(line);
      if (title) break;
    }
  }
  if (!title) {
    title = parseTitleFromRootReadme(rootReadme, num);
  }
  if (!title) {
    // Fallback: dir name minus number prefix
    title = dirName.replace(/^\d+\.\s+/, '').trim();
  }

  // Copy images
  const srcImagesDir = join(chSrcDir, 'images');
  const destImagesDir = join(PUBLIC_CHAPTERS, slug, 'images');
  const imagesOnDisk = new Set();
  const copiedFiles = [];

  if (existsSync(srcImagesDir)) {
    mkdirSync(destImagesDir, { recursive: true });
    for (const f of readdirSync(srcImagesDir)) {
      if (f.toLowerCase().endsWith('.png')) {
        const src = join(srcImagesDir, f);
        const dest = join(destImagesDir, f);
        copyFileSync(src, dest);
        imagesOnDisk.add(f);
        copiedFiles.push({ src, dest, filename: f });
        totalCopied++;
      }
    }
  } else {
    // Ensure chapter dir exists even without images
    mkdirSync(join(PUBLIC_CHAPTERS, slug), { recursive: true });
  }

  // Process markdown
  const { cleaned, figures, headings, summary, wordCount: wc, referencedImages } =
    processMarkdown(raw, slug, numToSlug);

  // Check for missing/unreferenced images
  const chMissing = [];
  for (const filename of referencedImages) {
    if (!imagesOnDisk.has(filename)) {
      chMissing.push(`/chapters/${slug}/images/${filename}`);
      missingImages.push({ slug, filename });
    }
  }

  const unreferencedImages = [];
  for (const filename of imagesOnDisk) {
    if (!referencedImages.has(filename)) {
      unreferencedImages.push(`/chapters/${slug}/images/${filename}`);
    }
  }

  // Write cleaned markdown
  mkdirSync(join(PUBLIC_CHAPTERS, slug), { recursive: true });
  writeFileSync(join(PUBLIC_CHAPTERS, slug, 'index.md'), cleaned, 'utf8');

  const concepts = existingConcepts[slug] ?? [];
  const readingMinutes = Math.ceil(wc / 220);

  chapters.push({
    slug,
    number: num,
    volume,
    title,
    summary,
    concepts,
    headings,
    figures,
    unreferencedImages,
    wordCount: wc,
    readingMinutes,
  });

  perChapterStats.push({
    slug, num, figures: figures.length, images: imagesOnDisk.size,
    referenced: referencedImages.size, missing: chMissing.length,
    unreferenced: unreferencedImages.length, wc, readingMinutes,
  });

  process.stdout.write(`  ${slug.padEnd(38)} ${figures.length} figs, ${imagesOnDisk.size} imgs\n`);
}

// Write index.json
const index = {
  source: {
    repo: 'https://github.com/liquidslr/system-design-notes',
    book: 'System Design Interview – An Insider\'s Guide (Vol 1 & 2), Alex Xu',
    importedAt: new Date().toISOString(),
  },
  chapters,
};
writeFileSync(EXISTING_INDEX, JSON.stringify(index, null, 2) + '\n', 'utf8');

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

console.log('\n─── Summary ───────────────────────────────────────────────────────');
console.log(`Chapters:      ${chapters.length}`);
console.log(`PNGs copied:   ${totalCopied}`);
console.log(`Total figures: ${chapters.reduce((s, c) => s + c.figures.length, 0)}`);

if (missingImages.length > 0) {
  console.log('\n⚠  Missing images (referenced but not in source images/):');
  for (const { slug, filename } of missingImages) console.log(`   ${slug}: ${filename}`);
} else {
  console.log('Missing images: none');
}

const allUnref = chapters.filter(c => c.unreferencedImages.length > 0);
if (allUnref.length > 0) {
  console.log('\nUnreferenced images (copied; shown in "Additional figures"):');
  for (const c of allUnref) {
    for (const u of c.unreferencedImages) console.log(`   ${u}`);
  }
} else {
  console.log('Unreferenced images: none');
}

console.log('\nPer-chapter figure counts:');
for (const s of perChapterStats) {
  console.log(`  ${s.slug.padEnd(38)} ${String(s.figures).padStart(3)} figs`);
}
console.log('\nDone. Run verify-import.mjs for full validation.\n');
