import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste one or more `docker run` commands, or a Compose file, into the input, drop a file on it, or use **Open file**. **docker run example** and **Compose example** load samples.',
    'Leave the direction on **Auto-detect** (a command that starts with `docker`, `podman` or `sudo docker` is converted to Compose, anything else is read as Compose YAML), or choose **docker run → Compose** or **Compose → docker run**.',
    'For Compose → docker run, tick **Add -d (detached)** and **One option per line** as you like.',
    'Read the **warnings** and notes under the output, then copy the result, download it as `docker-compose.yml` or `docker-run.sh`, or send it to another tool.',
    'Switch to the **Service Builder** tab to construct multi-service architectures visually. Load starter templates (Frontend + API, API + PostgreSQL, API + Redis, Full Stack), configure health checks and dependencies, inspect port conflict warnings, and export both `docker-compose.yml` and `.env.example`.',
  ],
  howItWorks:
    'The command is split into words with a POSIX shell tokenizer (quotes, backslash line continuations, `$\'…\'` strings). Then each `docker run` is parsed. Short flags can be clustered (`-dit`) or have their value attached (`-p8080:80`), and `--flag=value` and `--flag value` both work. The first word that isn’t an option is the image; everything after it is the command. Several commands separated by newlines, `&&` or `;` become several services.\n\n' +
    'Flags map to service keys, for example:\n\n' +
    '- `-p` to `ports`, `-e` to `environment`, `-v` to `volumes`\n' +
    '- `--mount` to long-form volumes, `--health-*` to `healthcheck`\n' +
    '- `--cpus` and `--memory` to `deploy.resources.limits`\n' +
    '- `--add-host`, `--cap-add`, `--cap-drop` and `--privileged` to their Compose keys\n\n' +
    'Named volumes are declared under top-level `volumes`. Named networks go under top-level `networks`, marked `external: true` because `docker run` needs them to exist.\n\n' +
    'Compose → docker run reads the YAML with the `yaml` package (anchors and merge keys supported). Each service becomes one `docker run` command, listed in `depends_on` order, with ports, environment, volumes, networks, health check, resources and command written as flags. Declared networks that Compose would create get a `docker network create` line first. Anything without an equivalent is reported as a warning.',
  limits: [
    'Input is limited to about 1 MB. Only `docker run` (and `docker container run`, `podman run`) commands are converted; other commands in the same paste are skipped with a warning.',
    'Flags with no Compose service key (`-P`, `--cpu-period`, `--detach-keys` and similar) are ignored and listed as warnings. `-d` and `--rm` are noted rather than written, because Compose has no equivalent.',
    'Compose → docker run ignores `build`, `profiles`, `configs`, `secrets`, `deploy.replicas` and other Swarm or Compose-only keys, and warns about each. `depends_on` only sets the order of the commands; `docker run` does not wait for health.',
    '`${VAR}` interpolation in a Compose file is passed through literally; replace those values with real ones. Relative bind mounts such as `./data` need an absolute path for `docker run`.',
    'Container names, networks and volumes keep the names you give them. Compose normally prefixes them with the project name, so names can differ from a real `docker compose up`.',
    'Several `--network` flags in one command need Docker 25 or newer.',
    'The Service Builder keeps image, build context and Dockerfile, container name, command, ports, volumes, environment, networks, restart, healthcheck and `depends_on` conditions. Any other key it imports (for example `user`, `tmpfs` mounts, `depends_on.restart`, or network and volume settings) is listed as a warning and left out of its YAML. An exec-form healthcheck (`["CMD", …]` or `["NONE"]`) is edited as a JSON array; plain text runs as `CMD-SHELL`.',
  ],
  privacy:
    'Conversion happens entirely in your browser; your commands and Compose files are never uploaded or stored. **Share** copies a link with your input in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it, so don’t share input that contains passwords or tokens. Text sent to or from another tool with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why is the network marked external?',
      answer:
        '`docker run --network name` only works when that network already exists, so the Compose file refers to it as `external: true`. Delete that line if you want Compose to create the network for you.',
    },
    {
      question: 'What happens to -d and --rm?',
      answer:
        'Compose services start in the background with `docker compose up -d`, so `-d` isn’t written to the file. There is no auto-remove option for a service; use `docker compose run --rm <service>` for a one-off container.',
    },
    {
      question: 'Can I convert several commands at once?',
      answer:
        'Yes. Paste them one after another (separated by newlines, `&&` or `;`) and each becomes a service. The service is named after `--name`, or after the image (`nginx:1.27` becomes `nginx`), with a number added if names clash.',
    },
    {
      question: 'How are ports and "no" kept as text in the YAML?',
      answer:
        'Values such as `8080:80` and `no` are double-quoted. Some YAML readers treat the bare forms as numbers or booleans, which Compose’s own documentation warns about.',
    },
    {
      question: 'How does the Service Builder validate my configuration?',
      answer:
        'The Service Builder analyzes your service graph for port conflicts (e.g. multiple services binding the same host port), missing dependency targets (`depends_on`), and undeclared named volumes. Note that in-browser validation catches common configuration bugs, but does not guarantee Docker or Docker Compose will accept or run the resulting file.',
    },
  ],
};

export default docs;
