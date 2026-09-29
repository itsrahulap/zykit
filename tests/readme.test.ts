import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('README tool list matches the registry (run `npm run generate:readme` if this fails)', () => {
  execFileSync('npx', ['tsx', 'scripts/generate-readme-tools.ts', '--check'], { stdio: 'pipe' });
});
