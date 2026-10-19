// User docs for Dockerfile Generator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose your **Stack**: Node.js API, React / Vite or Angular SPA, Python, FastAPI, Django, Java (Maven or Gradle), Go or a static site.',
    'Adjust the questions that apply, such as the runtime version, package manager, build and start commands, port and output folder. Problems are shown next to the field.',
    'Read the notes under the output: they list the assumptions to check, such as where your build writes its files.',
    'Copy or download the **Dockerfile** and the **.dockerignore**, put both in your project root, and run `docker build`.',
  ],
  howItWorks:
    'Each stack has a template that follows common Docker practice. Dependency files (`package.json` and the lockfile, `requirements.txt`, `pom.xml`, `go.mod`) are copied and installed before the rest of the source, so Docker can reuse that layer until your dependencies change. A multi-stage build compiles in one image and copies only the result into a clean, smaller one, and the final image runs as a non-root user.\n\n' +
    'Single-page apps are built with Node and served by an unprivileged nginx with a `try_files` fallback, so client-side routes work on reload. Go builds a static binary for a distroless image, and Java runs on a JRE-only image. Start commands are written in exec form (`CMD ["node", "server.js"]`) so the app receives stop signals directly, unless they need a shell.\n\n' +
    'The `.dockerignore` keeps `.git`, `.env` files, keys, logs and local build output out of the image. With **Explain each line in comments**, every instruction gets a comment saying why it is there.',
  limits: [
    'Default versions were last reviewed in June 2026 and are not looked up live. Check the official images on Docker Hub and pin the versions you test.',
    'Nothing is built or run here, so test the result with `docker build` and `docker run`.',
    'Python assumes a `requirements.txt` (export one from Poetry or uv). Java assumes the build makes a single jar. Go assumes no cgo.',
    'Java and Go images get no HEALTHCHECK because they have no shell or HTTP client; use your platform’s health probe instead.',
  ],
  privacy: 'Everything is generated in your browser. Nothing is uploaded, built or stored, and the tool never contacts Docker Hub.',
  faqs: [
    {
      question: 'How do I pass secrets like API keys?',
      answer:
        'Never put them in the Dockerfile: anything in it, or copied into the image, can be read by anyone with the image. Pass them when the container starts (`docker run -e` or `--env-file`, or your platform’s secrets), and use BuildKit secrets (`RUN --mount=type=secret`) for tokens needed only during the build.',
    },
    {
      question: 'Why copy the lockfile before the source?',
      answer: 'Docker caches each step. If only your code changes, the dependency install step is reused, which makes rebuilds much faster.',
    },
    {
      question: 'Why does the SPA image listen on 8080?',
      answer: 'The unprivileged nginx image runs as a normal user, and normal users can’t use ports below 1024. Map it with `docker run -p 80:8080`.',
    },
    {
      question: 'Is a multi-stage build always better?',
      answer: 'Usually: the final image leaves out compilers, dev dependencies and caches, so it is smaller and has less to attack. A single stage is simpler to debug and fine for quick experiments.',
    },
  ],
};

export default docs;
