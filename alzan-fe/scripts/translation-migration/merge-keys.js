#!/usr/bin/env node
/**
 * merge-translations.mjs
 *
 * Merges a JSON patch file into src/i18n/locales/es.ts
 *
 * Usage:
 *   node merge-translations.mjs <patch.json> [--es-path src/i18n/locales/es.ts] [--dry-run]
 *
 * The patch JSON should have the same nested shape as the es.ts default export.
 * Only the keys present in the patch will be updated; everything else is left untouched.
 */

import fs from 'fs';
import path from 'path';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
Usage: node merge-translations.mjs <patch.json> [options]

Options:
  --es-path <path>   Path to the es.ts file  (default: src/i18n/locales/es.ts)
  --dry-run          Print the result without writing to disk
  --help             Show this help
`);
  process.exit(0);
}

const patchPath = args[0];
const esPathIdx = args.indexOf('--es-path');
const esFilePath = esPathIdx !== -1 ? args[esPathIdx + 1] : 'src/i18n/locales/es.ts';
const dryRun = args.includes('--dry-run');

// ── Load files ────────────────────────────────────────────────────────────────
if (!fs.existsSync(patchPath)) {
  console.error(`❌  Patch file not found: ${patchPath}`);
  process.exit(1);
}
if (!fs.existsSync(esFilePath)) {
  console.error(`❌  es.ts file not found: ${esFilePath}`);
  process.exit(1);
}

const newKeys = [];
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
let esSource = fs.readFileSync(esFilePath, 'utf8');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Escape a string so it can be safely placed inside a JS string literal.
 * We preserve the original quote style of the existing value when possible,
 * but for simplicity we always write single-quoted strings.
 */
function escapeForSingleQuote(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Given a flat key path like ['nutrition', 'add'] and a new value,
 * replace the value in the TypeScript source string.
 *
 * The regex matches patterns like:
 *   key: 'value',
 *   key: "value",
 *   key: `value`,
 *
 * inside the correct section.  We walk section by section so we don't
 * accidentally touch a key with the same name in a different section.
 */
function replaceValue(source, keyPath, newValue) {
  if (typeof newValue !== 'string') {
    console.warn(`  ⚠️  Skipping non-string value at [${keyPath.join('.')}]:`, newValue);
    return source;
  }

  // Build a regex that finds the key inside the correct section block.
  // Strategy: locate the section object first, then replace the key inside it.
  if (keyPath.length === 1) {
    // Top-level key (rare in this file, but handle it)
    source = replaceLeafKey(source, keyPath[0], newValue);
  } else if (keyPath.length === 2) {
    const [section, key] = keyPath;
    source = replaceKeyInSection(source, section, key, newValue);
  } else {
    // Deeper nesting – replace recursively inside the section string
    console.warn(`  ⚠️  Deep key path [${keyPath.join('.')}] – only 2 levels are supported automatically.`);
  }

  return source;
}

/**
 * Insert a brand-new section block before the `} satisfies typeof en` closing line.
 */
function insertNewSection(source, sectionName, key, newValue) {
  const newBlock = `  ${sectionName}: {\n    ${key}: '${escapeForSingleQuote(newValue)}',\n  },\n`;

  // Try to insert before the closing `} satisfies typeof en;` line
  const satisfiesMatch = /(\n\} satisfies typeof \w+;?\s*)$/.exec(source);
  if (satisfiesMatch) {
    const insertAt = satisfiesMatch.index;
    return source.slice(0, insertAt) + '\n' + newBlock + source.slice(insertAt);
  }

  // Fallback: before the last `}`
  const lastBrace = source.lastIndexOf('}');
  if (lastBrace !== -1) {
    return source.slice(0, lastBrace) + newBlock + source.slice(lastBrace);
  }

  console.warn(`  ⚠️  Could not find insertion point for new section "${sectionName}"`);
  return source;
}

/**
 * Replace a key:value pair anywhere in the source (for top-level keys).
 */
function replaceLeafKey(source, key, newValue) {
  const regex = new RegExp(`(\\b${escapeRegex(key)}:\\s*)(['"\`])([\\s\\S]*?)\\2`, 'g');
  let replaced = false;
  const result = source.replace(regex, (match, prefix, quote, _old) => {
    replaced = true;
    return `${prefix}'${escapeForSingleQuote(newValue)}'`;
  });
  if (!replaced) console.warn(`  ⚠️  Key not found: ${key}`);
  return result;
}

/**
 * Replace a key inside a named section object.
 *
 * We find the section `sectionName: {` block, then within that block
 * we replace the first matching `key: 'value'`.
 */
function replaceKeyInSection(source, sectionName, key, newValue) {
  // Find the start of the section
  const sectionStart = findSectionStart(source, sectionName);
  if (sectionStart === -1) {
    console.warn(`  ➕  Section "${sectionName}" not found – inserting new section with key "${key}".`);
    return insertNewSection(source, sectionName, key, newValue);
  }

  // Find the matching closing brace for this section
  const sectionEnd = findMatchingBrace(source, sectionStart);
  if (sectionEnd === -1) {
    console.warn(`  ⚠️  Could not determine end of section: ${sectionName}`);
    return source;
  }

  const before = source.slice(0, sectionStart);
  let sectionBody = source.slice(sectionStart, sectionEnd);
  const after = source.slice(sectionEnd);

  // Now replace the key inside sectionBody
  const keyRegex = new RegExp(
    `(\\b${escapeRegex(key)}:\\s*)(['"\`])([\\s\\S]*?)\\2`,
    // We use a non-greedy match; for multi-line template literals this is
    // good enough for the single-line / short values typical in i18n files.
  );

  let replaced = false;
  sectionBody = sectionBody.replace(keyRegex, (match, prefix, _quote, _old) => {
    replaced = true;
    return `${prefix}'${escapeForSingleQuote(newValue)}'`;
  });

  if (!replaced) {
    newKeys.push(`${sectionName}.${key}`);
    console.warn(`  ➕  Key "${key}" not found in section "${sectionName}" – inserting it.`);
    // Insert before the closing brace of the section, matching indentation
    // Detect indentation by looking at existing keys in the section
    const indentMatch = sectionBody.match(/\n(\s+)\w+:/);
    const indent = indentMatch ? indentMatch[1] : '    ';
    sectionBody = sectionBody.replace(
      /(\s*)\}(\s*)$/,
      `\n${indent}${key}: '${escapeForSingleQuote(newValue)}',\n  }$2`,
    );
  }

  return before + sectionBody + after;
}

/**
 * Find the character index of the opening `{` for a section named `name`.
 * Matches:  name: {
 */
function findSectionStart(source, name) {
  const re = new RegExp(`\\b${escapeRegex(name)}:\\s*\\{`);
  const m = re.exec(source);
  if (!m) return -1;
  // Return the index of the `{`
  return m.index + m[0].length - 1;
}

/**
 * Given the index of an opening `{`, find its matching `}`.
 * Accurately skips braces inside strings and comments.
 */
function findMatchingBrace(source, openIdx) {
  let depth = 0;
  let inString = null; // null, "'", '"', or "`"
  let inComment = null; // null, "line", or "block"

  for (let i = openIdx; i < source.length; i++) {
    const char = source[i];

    // --- Inside String ---
    if (inString) {
      if (char === '\\') {
        i++; // skip escaped char
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    // --- Inside Comment ---
    if (inComment) {
      if (inComment === 'line') {
        if (char === '\n') inComment = null;
      } else if (inComment === 'block') {
        if (char === '*' && source[i + 1] === '/') {
          inComment = null;
          i++; // skip '/'
        }
      }
      continue;
    }

    // --- Start String ---
    if (char === "'" || char === '"' || char === '`') {
      inString = char;
      continue;
    }

    // --- Start Comment ---
    if (char === '/') {
      if (source[i + 1] === '/') {
        inComment = 'line';
        i++;
        continue;
      } else if (source[i + 1] === '*') {
        inComment = 'block';
        i++;
        continue;
      }
    }

    // --- Braces ---
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) return i + 1; // exclusive end
    }
  }
  return -1;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Walk the patch and apply each leaf ───────────────────────────────────────

let changeCount = 0;

function walkPatch(obj, path = []) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      walkPatch(value, currentPath);
    } else {
      console.log(`  ✏️  [${currentPath.join('.')}]  →  ${JSON.stringify(value)}`);
      esSource = replaceValue(esSource, currentPath, value);
      changeCount++;
    }
  }
}

console.log(`\n📄  es.ts   : ${esFilePath}`);
console.log(`📦  patch   : ${patchPath}`);
console.log(`🔧  dry-run : ${dryRun}\n`);
console.log('Changes:');

walkPatch(patch);

console.log(`\n✅  ${changeCount} key(s) processed.`);

// ── Write result ──────────────────────────────────────────────────────────────
if (dryRun) {
  console.log('\n--- DRY RUN – result would be written to:', esFilePath, '---\n');
  console.log(esSource);
} else {
  // Backup original
  const backupPath = esFilePath + '.bak';
  fs.copyFileSync(esFilePath, backupPath);
  console.log(`\n💾  Backup saved to: ${backupPath}`);

  fs.writeFileSync(esFilePath, esSource, 'utf8');
  console.log(`✨  Written to: ${esFilePath}`);
  console.log(newKeys);
}
