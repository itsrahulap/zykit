// Builds a Dockerfile and .dockerignore from a preset and a few answers. Every instruction carries a
// one-line reason, shown in the page and optionally written as comments. Pure: no DOM, nothing is run.

export type Preset = 'node' | 'vite' | 'angular' | 'python' | 'fastapi' | 'django' | 'maven' | 'gradle' | 'go' | 'static';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';
type Family = 'node' | 'spa' | 'python' | 'java' | 'go' | 'static';

/** Default runtime versions. Kept in one place; check them against the official images before use. */
export const VERSIONS = { node: '22', python: '3.13', go: '1.25', java: '21', nginx: '1.27' };
export const VERSIONS_REVIEWED = 'June 2026';

export interface PresetInfo {
  label: string;
  family: Family;
  /** Default version for the runtime the user can edit. */
  version: string;
  port: number;
  build: string;
  start: string;
  /** Where the build output is (SPA / static source). */
  output: string;
}

export const PRESETS: Record<Preset, PresetInfo> = {
  node: { label: 'Node.js API', family: 'node', version: VERSIONS.node, port: 3000, build: 'npm run build', start: 'node dist/server.js', output: '' },
  vite: { label: 'React / Vite SPA', family: 'spa', version: VERSIONS.node, port: 8080, build: 'npm run build', start: '', output: 'dist' },
  angular: { label: 'Angular SPA', family: 'spa', version: VERSIONS.node, port: 8080, build: 'npm run build', start: '', output: 'dist/my-app/browser' },
  python: { label: 'Python app', family: 'python', version: VERSIONS.python, port: 8000, build: '', start: 'python main.py', output: '' },
  fastapi: { label: 'FastAPI', family: 'python', version: VERSIONS.python, port: 8000, build: '', start: 'uvicorn main:app --host 0.0.0.0 --port {port}', output: '' },
  django: { label: 'Django', family: 'python', version: VERSIONS.python, port: 8000, build: '', start: 'gunicorn mysite.wsgi:application --bind 0.0.0.0:{port}', output: '' },
  maven: { label: 'Java (Maven)', family: 'java', version: VERSIONS.java, port: 8080, build: 'mvn -B -q package -DskipTests', start: '', output: 'target' },
  gradle: { label: 'Java (Gradle)', family: 'java', version: VERSIONS.java, port: 8080, build: 'gradle build -x test --no-daemon', start: '', output: 'build/libs' },
  go: { label: 'Go (static binary)', family: 'go', version: VERSIONS.go, port: 8080, build: './cmd/app', start: '', output: '' },
  static: { label: 'Static site', family: 'static', version: VERSIONS.nginx, port: 8080, build: '', start: '', output: 'public' },
};

export interface DockerOptions {
  preset: Preset;
  version: string;
  packageManager: PackageManager;
  /** Build command (Node/Java) or package path (Go). */
  build: string;
  start: string;
  output: string;
  port: string;
  workdir: string;
  multiStage: boolean;
  healthcheck: boolean;
  healthPath: string;
  comments: boolean;
}

export function defaultsFor(preset: Preset): DockerOptions {
  const p = PRESETS[preset];
  return { preset, version: p.version, packageManager: 'npm', build: p.build, start: p.start, output: p.output, port: String(p.port), workdir: '/app', multiStage: true, healthcheck: true, healthPath: p.family === 'spa' || p.family === 'static' ? '/' : '/health', comments: true };
}

export interface Line {
  text: string;
  /** Why this instruction is here; omitted for blank lines. */
  why?: string;
}

export interface DockerResult {
  dockerfile: string;
  dockerignore: string;
  lines: Line[];
  /** Assumptions and things to check. */
  notes: string[];
  /** Field id → problem; when non-empty nothing is generated. */
  errors: Record<string, string>;
}

const SHELLY = /[|&;<>$`\\"'(){}*?]/;

/** Exec-form `["a","b"]` when the command is plain words, otherwise shell form (with a note). */
function cmdForm(cmd: string, notes: string[], what: string): string {
  const words = cmd.trim().split(/\s+/);
  if (!SHELLY.test(cmd)) return JSON.stringify(words).replace(/","/g, '", "');
  notes.push(`The ${what} uses shell syntax, so it is written in shell form (run by /bin/sh). Exec form is preferred so the process gets signals directly.`);
  return cmd.trim();
}

export function validate(o: DockerOptions): Record<string, string> {
  const e: Record<string, string> = {};
  const fam = PRESETS[o.preset].family;
  if (!/^\d+(\.\d+){0,2}$/.test(o.version.trim())) e.version = 'Use a version number like 22 or 3.13.';
  const port = Number(o.port);
  if (!/^\d+$/.test(o.port.trim()) || port < 1 || port > 65535) e.port = 'A port from 1 to 65535.';
  if (!/^\/[\w./-]*$/.test(o.workdir.trim())) e.workdir = 'An absolute path like /app (letters, digits, / . _ -).';
  for (const k of ['build', 'start', 'healthPath'] as const) if (/[\r\n]/.test(o[k])) e[k] = 'One line only.';
  if (fam === 'node' && !o.start.trim()) e.start = 'Required.';
  if (fam === 'python' && !o.start.trim()) e.start = 'Required.';
  if ((fam === 'spa' || fam === 'static' || fam === 'java') && !/^[\w./-]+$/.test(o.output.trim())) e.output = 'A relative folder like dist (no spaces).';
  if (fam === 'go' && !/^\.?[\w./-]*$/.test(o.build.trim())) e.build = 'A package path like ./cmd/app or .';
  if (o.healthcheck && !/^\/[\w./?=&%-]*$/.test(o.healthPath.trim())) e.healthPath = 'A path starting with / (no spaces or quotes).';
  return e;
}

const IGNORE_COMMON = ['# Version control and editors', '.git', '.vscode', '.idea', '.DS_Store', '', '# Docker files themselves', 'Dockerfile*', '.dockerignore', 'compose*.y*ml', '', '# Secrets: never send them to the build', '.env', '.env.*', '!.env.example', '*.pem', '*.key', '', '# Logs', '*.log'];
const IGNORE: Record<Family, string[]> = {
  node: ['node_modules', 'dist', 'build', 'coverage', '.npm'],
  spa: ['node_modules', 'dist', 'build', 'coverage', '.angular', '.npm'],
  python: ['__pycache__', '*.py[cod]', '.venv', 'venv', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'htmlcov'],
  java: ['target', 'build', '.gradle', '*.class'],
  go: ['bin', '*.test', 'coverage.out'],
  static: [],
};

export function generate(o: DockerOptions): DockerResult {
  const errors = validate(o);
  const fam = PRESETS[o.preset].family;
  const dockerignore = [...IGNORE_COMMON, ...(IGNORE[fam].length ? ['', '# Build output and dependencies (rebuilt inside the image)', ...IGNORE[fam]] : [])].join('\n') + '\n';
  if (Object.keys(errors).length) return { dockerfile: '', dockerignore, lines: [], notes: [], errors };

  const v = o.version.trim();
  const port = o.port.trim();
  const wd = o.workdir.trim();
  const notes: string[] = [];
  const lines: Line[] = [{ text: '# syntax=docker/dockerfile:1', why: 'Uses the current Dockerfile syntax (needed for heredocs and BuildKit features).' }];
  const add = (text: string, why?: string) => lines.push({ text, why });
  const gap = () => add('');
  const health = (cmd: string) => {
    if (o.healthcheck) add(`HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\\n  CMD ${cmd}`, `Marks the container unhealthy if ${o.healthPath.trim()} stops answering.`);
  };
  const url = `http://127.0.0.1:${port}${o.healthPath.trim()}`;

  if (fam === 'node' || fam === 'spa') {
    const pm = o.packageManager;
    const lock = { npm: 'package-lock.json', pnpm: 'pnpm-lock.yaml', yarn: 'yarn.lock' }[pm];
    const install = { npm: 'npm ci', pnpm: 'pnpm install --frozen-lockfile', yarn: 'yarn install --immutable' }[pm];
    const base = `node:${v}-alpine`;
    const multi = fam === 'spa' || o.multiStage;
    add(`FROM ${base}${multi ? ' AS build' : ''}`, `Official Node.js ${v} image on Alpine Linux (small).`);
    if (pm !== 'npm') add('RUN corepack enable', `Turns on ${pm} through Corepack, which ships with Node.`);
    add(`WORKDIR ${wd}`, 'All following commands run in this folder.');
    add(`COPY package.json ${lock} ./`, 'Copies only the dependency lists first, so the install layer is cached until they change.');
    add(`RUN ${install}`, 'Installs exactly the versions in the lockfile.');
    add('COPY . .', 'Copies the rest of the source (filtered by .dockerignore).');
    if (o.build.trim()) add(`RUN ${o.build.trim()}`, 'Builds the app.');
    if (pm === 'yarn') notes.push('yarn install --immutable is Yarn 2+. For Yarn 1 use yarn install --frozen-lockfile.');

    if (fam === 'spa') {
      gap();
      add(`FROM nginxinc/nginx-unprivileged:${VERSIONS.nginx}-alpine`, 'A small nginx image that already runs as a non-root user (listens on 8080).');
      add(`COPY --from=build ${wd}/${o.output.trim()} /usr/share/nginx/html`, 'Copies only the built files; Node and the source stay behind.');
      add(
        `COPY <<'EOF' /etc/nginx/conf.d/default.conf\nserver {\n    listen ${port};\n    root /usr/share/nginx/html;\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\nEOF`,
        'Serves the app and sends unknown paths to index.html, so client-side routes work on reload.',
      );
      add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
      health(`wget -qO- ${url} > /dev/null || exit 1`);
      if (o.output.trim() !== PRESETS[o.preset].output) notes.push(`Check that your build writes to ${o.output.trim()}.`);
      if (o.preset === 'angular') notes.push('Angular 17+ writes to dist/<project>/browser. Replace my-app with your project name.');
      if (o.healthcheck && o.healthPath.trim() !== '/') notes.push('A static site has no health endpoint; the check just requests a file, so / is usually enough.');
    } else if (multi) {
      if (pm === 'npm') add('RUN npm prune --omit=dev', 'Removes dev dependencies before copying node_modules to the final image.');
      if (pm === 'pnpm') add('RUN pnpm prune --prod', 'Removes dev dependencies before copying node_modules to the final image.');
      if (pm === 'yarn') notes.push('Dev dependencies are kept with Yarn. Use yarn workspaces focus --production (Yarn 2+) to drop them.');
      gap();
      add(`FROM ${base}`, 'A fresh image for running: no build tools or caches from the build stage.');
      add('ENV NODE_ENV=production', 'Tells libraries to run in production mode.');
      add(`WORKDIR ${wd}`, 'The app folder.');
      add(`COPY --from=build --chown=node:node ${wd} ./`, 'Copies the built app and production dependencies, owned by the non-root user.');
    } else add('ENV NODE_ENV=production', 'Tells libraries to run in production mode.');
    if (fam === 'node') {
      add('USER node', 'Runs as the unprivileged node user that the official image provides.');
      add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
      health(`node -e "fetch('${url}').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`);
      add(`CMD ${cmdForm(o.start, notes, 'start command')}`, 'Starts the app.');
      notes.push(`The app must listen on 0.0.0.0:${port}, not localhost, to be reachable from outside the container.`);
    }
  }

  if (fam === 'python') {
    const base = `python:${v}-slim`;
    const env = 'ENV PYTHONDONTWRITEBYTECODE=1 \\\n    PYTHONUNBUFFERED=1';
    const envWhy = 'No .pyc files, and logs appear immediately.';
    if (o.multiStage) {
      add(`FROM ${base} AS build`, `Official Python ${v} slim image (Debian, small).`);
      add('RUN python -m venv /opt/venv', 'A virtual environment that is easy to copy to the final image.');
      add('ENV PATH="/opt/venv/bin:$PATH"', 'Uses the venv’s python and pip.');
      add('COPY requirements.txt .', 'Copies only the dependency list first, so the install layer is cached.');
      add('RUN pip install --no-cache-dir -r requirements.txt', 'Installs dependencies without keeping pip’s download cache.');
      gap();
      add(`FROM ${base}`, 'A fresh image without compilers or pip caches.');
      add(`${env} \\\n    PATH="/opt/venv/bin:$PATH"`, envWhy);
      add('RUN useradd --create-home --uid 10001 app', 'Creates an unprivileged user to run the app.');
      add(`WORKDIR ${wd}`, 'The app folder.');
      add('COPY --from=build /opt/venv /opt/venv', 'Brings in the installed dependencies.');
    } else {
      add(`FROM ${base}`, `Official Python ${v} slim image (Debian, small).`);
      add(env, envWhy);
      add('RUN useradd --create-home --uid 10001 app', 'Creates an unprivileged user to run the app.');
      add(`WORKDIR ${wd}`, 'The app folder.');
      add('COPY requirements.txt .', 'Copies only the dependency list first, so the install layer is cached.');
      add('RUN pip install --no-cache-dir -r requirements.txt', 'Installs dependencies without keeping pip’s download cache.');
    }
    add('COPY --chown=app:app . .', 'Copies the source, owned by the app user.');
    add('USER app', 'Runs as the unprivileged user.');
    add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
    health(`python -c "import urllib.request; urllib.request.urlopen('${url}', timeout=4)"`);
    add(`CMD ${cmdForm(o.start.replace(/\{port\}/g, port), notes, 'start command')}`, 'Starts the app.');
    notes.push('Assumes a requirements.txt. For Poetry or uv, export one first (poetry export / uv export) or adapt the install step.');
    if (o.preset === 'fastapi' || o.preset === 'django') notes.push(`Make sure ${o.preset === 'fastapi' ? 'uvicorn' : 'gunicorn'} is listed in requirements.txt.`);
    if (o.preset === 'django') notes.push('Run python manage.py collectstatic during the build (or serve static files elsewhere), and set DJANGO_SETTINGS_MODULE and SECRET_KEY at runtime.');
  }

  if (fam === 'java') {
    const maven = o.preset === 'maven';
    add(`FROM ${maven ? `maven:3.9-eclipse-temurin-${v}` : `gradle:8-jdk${v}`} AS build`, `${maven ? 'Maven' : 'Gradle'} with JDK ${v}, used only to build.`);
    add('WORKDIR /src', 'Build folder.');
    if (maven) {
      add('COPY pom.xml .', 'Copies only the build file first, so downloaded dependencies are cached.');
      add('RUN mvn -B -q dependency:go-offline', 'Downloads dependencies into a cached layer.');
      add('COPY src ./src', 'Copies the source.');
    } else add('COPY . .', 'Copies the build files and source.');
    add(`RUN ${o.build.trim() || (maven ? 'mvn -B -q package -DskipTests' : 'gradle build -x test --no-daemon')}`, 'Builds the jar (tests are skipped here; run them in CI).');
    gap();
    add(`FROM eclipse-temurin:${v}-jre`, `Java ${v} runtime only (no compiler), from Eclipse Temurin.`);
    add('RUN useradd --create-home --uid 10001 app', 'Creates an unprivileged user to run the app.');
    add(`WORKDIR ${wd}`, 'The app folder.');
    add(`COPY --from=build /src/${o.output.trim()}/*.jar app.jar`, 'Copies the built jar from the build stage.');
    add('USER app', 'Runs as the unprivileged user.');
    add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
    add(`ENTRYPOINT ["java", "-jar", "${wd}/app.jar"]`, 'Starts the app; extra docker run arguments are passed to it.');
    notes.push(`If the build makes more than one jar (Spring Boot also writes a -plain.jar), copy the exact file name instead of ${o.output.trim()}/*.jar.`);
    if (o.healthcheck) notes.push('No HEALTHCHECK: the JRE image has no curl or wget. Use your orchestrator’s HTTP probe, or add one of them to the image.');
  }

  if (fam === 'go') {
    const pkg = o.build.trim() || '.';
    add(`FROM golang:${v}-alpine AS build`, `Go ${v} toolchain, used only to build.`);
    add('WORKDIR /src', 'Build folder.');
    add('COPY go.mod go.sum ./', 'Copies the module files first, so downloaded modules are cached.');
    add('RUN go mod download', 'Downloads dependencies into a cached layer.');
    add('COPY . .', 'Copies the source.');
    add(`RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/app ${pkg}`, 'Builds a static binary (no C libraries needed), without debug info or local paths.');
    gap();
    add('FROM gcr.io/distroless/static-debian12:nonroot', 'A minimal image with no shell or package manager, running as a non-root user.');
    add('COPY --from=build /out/app /app', 'Copies just the binary.');
    add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
    add('ENTRYPOINT ["/app"]', 'Runs the binary.');
    notes.push('If you use cgo, CGO_ENABLED=0 won’t work: build with cgo and use a base image with libc (such as distroless/base).');
    if (o.healthcheck) notes.push('No HEALTHCHECK: distroless has no shell or curl. Add a health subcommand to your binary, or use your orchestrator’s HTTP probe.');
  }

  if (fam === 'static') {
    add(`FROM nginxinc/nginx-unprivileged:${v}-alpine`, 'A small nginx image that runs as a non-root user (listens on 8080).');
    add(`COPY ${o.output.trim()}/ /usr/share/nginx/html/`, 'Copies your site’s files.');
    if (port !== '8080') {
      add(`COPY <<'EOF' /etc/nginx/conf.d/default.conf\nserver {\n    listen ${port};\n    root /usr/share/nginx/html;\n}\nEOF`, `Makes nginx listen on ${port}.`);
      if (Number(port) < 1024) notes.push('Ports below 1024 need root; the unprivileged image can’t bind them. Keep 8080 inside and map it with docker run -p 80:8080.');
    }
    add(`EXPOSE ${port}`, 'Documents the port; publish it with docker run -p.');
    health(`wget -qO- ${url} > /dev/null || exit 1`);
  }

  notes.push('Never put secrets in the Dockerfile or bake them into the image. Pass them at run time (docker run -e / --env-file, or your platform’s secrets), and use BuildKit secrets (RUN --mount=type=secret) for build-time tokens.');
  notes.push(`Image versions are defaults last reviewed in ${VERSIONS_REVIEWED}, not necessarily the newest. Check the official images and pin what you test.`);
  const dockerfile =
    lines
      .flatMap((l) => (o.comments && l.why && !l.text.startsWith('# syntax') ? [`# ${l.why}`, l.text] : [l.text]))
      .join('\n') + '\n';
  return { dockerfile, dockerignore, lines, notes, errors };
}
