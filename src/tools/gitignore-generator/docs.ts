import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Search the template list and tick the languages, frameworks, editors and operating systems you use. Selected templates appear as chips you can click to remove.',
    'Add anything project-specific under **Custom lines**. The merged file appears on the right with a `# === Name ===` header per section.',
    'Use **Copy** or **Download .gitignore**, and save the file in the root of your repository.',
    'To check a rule, paste file paths in **Test paths** (end a directory with `/`). Each path shows whether it is ignored and which line decided it. Optionally paste your own rules to test those instead.',
  ],
  howItWorks:
    'About 75 templates are bundled with the page, written for this tool from common practice for each ecosystem. Merging joins the selected templates in the order you chose them, drops any pattern line that an earlier section (or your custom lines) already contains, and keeps comments.\n\n' +
    'The tester implements gitignore semantics in JavaScript: blank lines and `#` comments are skipped; a leading `!` re-includes; a pattern with a `/` at the start or middle is anchored to the repository root, otherwise it matches a name at any depth; a trailing `/` matches directories only; `*` and `?` never match `/`; `[abc]`, `[a-z]`, `[!x]` and `[[:digit:]]` classes work; `**` works as `**/x`, `x/**` and `a/**/b`; `\\` escapes `#`, `!`, spaces and wildcards; trailing unescaped spaces are ignored. The last matching rule wins. Parent directories are checked first, so a file inside an excluded directory stays ignored even if a later `!` rule names it, as in git.',
  limits: [
    'The tester reads one rule list as if it were the `.gitignore` at the repository root. Nested `.gitignore` files, `.git/info/exclude`, the global ignore file and files already tracked by git are not considered (git never ignores a tracked file).',
    'Matching is case-sensitive unless you tick **Ignore case**. Unicode normalisation (macOS) and symbolic links are not modelled.',
    'Whether a path is a directory comes from a trailing `/` you type. The tester cannot look at your disk.',
    'Up to 2,000 paths and 20,000 rule lines are tested. Templates are a starting point, not a complete copy of any official list; review them against your project.',
  ],
  privacy:
    'Templates are bundled in the page and matching runs in your browser; nothing is fetched, uploaded or stored. **Share** copies a link that holds your selection, custom lines and test input in the URL’s `#` fragment, which browsers do not send to servers. Anyone with the link can read it. If you receive text from another tool, it is handed over through this tab’s session storage and removed as soon as it is read.',
  faqs: [
    {
      question: 'Why is my file still ignored after I added a ! rule?',
      answer: 'Git cannot re-include a file if one of its parent directories is excluded. Ignore the directory’s contents with `build/*` instead of `build/`, then add `!build/keep.txt`.',
    },
    {
      question: 'Why is a file I already committed still tracked?',
      answer: '.gitignore only affects untracked files. Run `git rm --cached <file>` to stop tracking it, then commit.',
    },
    {
      question: 'What is the difference between `foo`, `/foo` and `foo/`?',
      answer: '`foo` matches any file or directory named foo at any depth, `/foo` only the one in the repository root, and `foo/` only directories named foo.',
    },
    {
      question: 'Why are duplicate lines removed?',
      answer: 'Templates such as Node.js, React and Next.js share many patterns. The first section keeps the line and later copies are dropped, so the merged file stays short without changing what is ignored.',
    },
  ],
};

export default docs;
