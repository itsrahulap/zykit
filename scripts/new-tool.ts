// Scaffolds a new tool: definition, page, feature module, unit test and e2e spec, registers it and
// refreshes the README tool list.
//
//   npm run new:tool -- <tool-id> --name "Tool Name" --category Developer --icon code \
//     [--tagline "One line for the card"] [--description "A sentence or two."] [--tags "A,B"]
//
// Categories in use: see src/tools/*/index.ts. Icons: IconName in src/shared/ui/ui.tsx.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

if (!id || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) fail('Usage: npm run new:tool -- <tool-id> --name "Name" --category Developer --icon code  (id: lowercase-with-dashes)');
const name = flag('name') ?? fail('--name is required');
const category = flag('category') ?? fail('--category is required (e.g. Developer, Data, Text, Web, Security, Images)');
const icon = flag('icon') ?? 'code';
const tagline = flag('tagline') ?? `TODO: one line for the ${name} card`;
const description = flag('description') ?? `TODO: a sentence or two describing ${name}.`;
const tags = (flag('tags') ?? name).split(',').map((t) => t.trim()).filter(Boolean);

const iconSource = readFileSync(join(root, 'src/shared/ui/ui.tsx'), 'utf8');
if (!iconSource.includes(`'${icon}'`)) fail(`Unknown icon "${icon}". Pick one from IconName in src/shared/ui/ui.tsx or add it there.`);

const camel = id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const pascal = camel[0].toUpperCase() + camel.slice(1);
const page = `${pascal}Page`;
const dir = join(root, 'src/tools', id);
if (existsSync(dir)) fail(`src/tools/${id} already exists.`);

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const files: [string, string][] = [
  [
    `src/tools/${id}/index.ts`,
    `import type { ToolDefinition } from '../types';

const ${camel}: ToolDefinition = {
  id: '${id}',
  name: ${q(name)},
  tagline: ${q(tagline)},
  description:
    ${q(description)},
  category: ${q(category)},
  icon: '${icon}',
  tags: [${tags.map(q).join(', ')}],
  status: 'available',
  load: () => import('./${page}'),
  docs: () => import('./docs'),
};

export default ${camel};
`,
  ],
  [
    `src/tools/${id}/${page}.tsx`,
    `import { useState } from 'react';
import ${camel} from './index';
import { transform } from './features/${id}';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';

export default function ${page}() {
  const [input, setInput] = useState('');
  const output = transform(input);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={${camel}} />
      <Headline accent="TODO">${name.replace(/[{}<>]/g, '')} </Headline>
      <StatusStrip status={input ? 'Done.' : 'Paste something to start.'} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CodeArea label="Input" value={input} onChange={(e) => setInput(e.target.value)} rows={12} />
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Output</h2>
            <CopyButton text={output} />
          </div>
          <CodeBlock>{output}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
`,
  ],
  [
    `src/tools/${id}/features/${id}.ts`,
    `// Pure logic for ${name}: no DOM, so it's unit-testable in Node.

export function transform(input: string): string {
  return input;
}
`,
  ],
  [
    `src/tools/${id}/docs.ts`,
    `// User docs for ${name}, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: ['TODO: first step', 'TODO: second step', 'TODO: third step'],
  howItWorks: 'TODO: what actually happens when ${name.replace(/'/g, "\\'")} runs: the algorithm, standard or browser API, and where it runs.',
  limits: ['TODO: real input limits, unsupported formats and edge cases'],
  privacy: 'TODO: where data is processed, and whether anything is stored or leaves the device.',
  faqs: [
    { question: 'TODO: first question?', answer: 'TODO' },
    { question: 'TODO: second question?', answer: 'TODO' },
    { question: 'TODO: third question?', answer: 'TODO' },
  ],
};

export default docs;
`,
  ],
  [
    `src/tools/${id}/README.md`,
    `# ${name}

## Purpose

TODO: what this tool does. User-facing docs live in [\`docs.ts\`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| \`index.ts\` | Tool definition |
| \`${page}.tsx\` | Page |
| \`features/${id}.ts\` | Pure logic |

## Core Logic

TODO: where the main processing happens and how it works.

## Limits

TODO: important technical limits.

## Tests

- Unit: \`tests/tools/${id}/${id}.test.ts\`. \`npm test -- ${id}\`
- E2E: \`e2e/${id}.spec.ts\`. \`npm run test:e2e -- ${id}\`

## Known Gaps

TODO: known issues or missing functionality.
`,
  ],
  [
    `tests/tools/${id}/${id}.test.ts`,
    `import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/${id}/features/${id}';

describe('${name}', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
`,
  ],
  [
    `e2e/${id}.spec.ts`,
    `import { expect, test } from '@playwright/test';

test('${name} works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(\`\${r.method()} \${r.url()}\`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/${id}');
  await expect(page).toHaveTitle(/${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/);
  await page.getByLabel('Input').fill('abc');
  await expect(page.getByText('abc').last()).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('${name} has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/${id}');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
`,
  ],
];

for (const [path, text] of files) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
  console.log(`created ${path}`);
}

// Register it: import after the last tool import, entry at the end of TOOLS.
const registryPath = join(root, 'src/tools/registry.ts');
let registry = readFileSync(registryPath, 'utf8');
registry = registry.replace("import type { ToolDefinition } from './types';", `import ${camel} from './${id}';\nimport type { ToolDefinition } from './types';`);
registry = registry.replace(/\n\];\n\nexport const toolPath/, `\n  ${camel},\n];\n\nexport const toolPath`);
if (!registry.includes(`  ${camel},\n];`)) fail('Could not add the tool to src/tools/registry.ts; add it by hand.');
writeFileSync(registryPath, registry);
console.log('registered in src/tools/registry.ts');

execFileSync('npx', ['tsx', 'scripts/generate-readme-tools.ts'], { cwd: root, stdio: 'inherit' });
console.log(`\nNext: build the page in src/tools/${id}/, fill in docs.ts and README.md, then run npm test and the e2e spec. Open http://localhost:5173/tools/${id}`);
