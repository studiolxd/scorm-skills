#!/usr/bin/env node
// Generate the distributable layout from the single canonical source (source/skill.md).
// Outputs at the REPO ROOT so the Claude Code marketplace is directly installable:
//   /plugin marketplace add studiolxd/scorm-skills
// Run: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(resolve(root, 'source/skill.md'), 'utf8');

const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) throw new Error('source/skill.md is missing frontmatter');
const [, fm, body] = m;

const field = (key) => {
  const line = fm.split('\n').find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : '';
};
const name = field('name');
const description = field('description');
const globs = field('globs');
const VERSION = '1.0.0';

// Concise text for marketplace/plugin surfaces (the frontmatter `description` is the
// long skill-trigger text — too verbose for a marketplace card).
const SHORT_DESC = 'Teach AI agents to use @studiolxd/scorm — headless SCORM 1.2/2004 runtime (React, Vue, Angular, Svelte, Web Component, vanilla).';
const REPO = 'https://github.com/studiolxd/scorm-skills';
const AUTHOR = { name: 'StudioLXD', email: 'hello@studiolxd.com' };
const KEYWORDS = ['scorm', 'scorm-1-2', 'scorm-2004', 'lms', 'e-learning', 'react', 'vue', 'angular', 'svelte'];

const write = (rel, content) => {
  const out = resolve(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, typeof content === 'string' ? content.trimStart() : JSON.stringify(content, null, 2) + '\n');
  console.log('wrote', rel);
};

// Claude Code marketplace + plugin (root-level so the repo is directly installable).
write('.claude-plugin/marketplace.json', {
  name: 'studiolxd-scorm',
  description: SHORT_DESC,
  owner: { ...AUTHOR, url: 'https://github.com/studiolxd' },
  plugins: [{
    name,
    source: `./plugins/${name}`,
    displayName: 'SCORM Integration',
    description: SHORT_DESC,
    version: VERSION,
    author: AUTHOR,
    homepage: `${REPO}#readme`,
    repository: REPO,
    license: 'MIT',
    keywords: KEYWORDS,
    category: 'integration',
  }],
});
write(`plugins/${name}/.claude-plugin/plugin.json`, {
  name,
  description: SHORT_DESC,
  version: VERSION,
  author: AUTHOR,
  homepage: `${REPO}#readme`,
  repository: REPO,
  license: 'MIT',
  keywords: KEYWORDS,
});
write(`plugins/${name}/skills/${name}/SKILL.md`, `---
name: ${name}
description: ${description}
---

${body.trim()}
`);

// Cursor rule.
write(`cursor/${name}.mdc`, `---
description: ${description}
globs: ${globs}
alwaysApply: false
---

${body.trim()}
`);

// Portable baseline (Antigravity, Copilot, generic).
write(`agents/${name}.md`, `# ${name}

${body.trim()}
`);

console.log('\nDone. One source → Claude marketplace, Cursor rule, portable baseline.');
