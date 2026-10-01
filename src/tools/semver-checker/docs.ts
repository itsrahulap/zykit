import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type an npm-style **Range**, such as `^1.2.0`, `~2.x`, `>=2.1 <3` or `1.2.3 - 2.3.4`, or press **Try an example**. **Means** shows the range as plain bounds.',
    'Paste **Versions** separated by spaces, commas or new lines. Each is marked as satisfying the range or not, with the reason, and **Summary** shows the highest and lowest match and any versions that aren’t valid SemVer.',
    'Tick **Include prereleases** to let prerelease versions such as `2.0.0-beta.1` match any range, as npm’s `--include-prerelease` does.',
    'Read **Sorted by precedence**, switching between **Newest first** and **Oldest first**, and copy the list or the check results.',
    'In **Bump preview**, enter a **Version** (or leave it to use the first sorted version) and an optional **Prerelease id** like `beta` to see what each `npm version` bump would produce.',
  ],
  howItWorks:
    'Versions are parsed strictly by SemVer 2.0.0: `MAJOR.MINOR.PATCH`, an optional `-prerelease` and `+build`, with no leading zeros. A leading `v` or `=` is accepted. Precedence compares the three numbers, then puts a prerelease below its release and compares prerelease identifiers one by one: numbers numerically, text in ASCII order, and numbers below text. Build metadata is ignored.\n\n' +
    'Ranges follow the grammar documented by npm’s node-semver. `||` separates alternatives and spaces join comparators (`<`, `<=`, `>`, `>=`, `=`). `^` allows changes that don’t modify the leftmost non-zero number, `~` (or `~>`) allows patch changes, `x`, `X`, `*` or a missing part is a wildcard, and `A - B` is an inclusive hyphen range. Each range is rewritten into bounds such as `>=1.2.0 <2.0.0-0`, which is what **Means** shows.\n\n' +
    'As in npm, a prerelease version only matches when one of the comparators in the same alternative has a prerelease on the same major, minor and patch, so `^1.2.3-beta.1` matches `1.2.3-beta.2` but not `1.2.4-beta.1`. Bumps follow node-semver’s `inc()`. Everything runs in your browser.',
  limits: [
    'Versions must be full `x.y.z` versions. Partial versions like `1.2`, leading zeros and numbers above JavaScript’s safe integer limit are rejected. In **Versions**, spaces separate entries, so each version must be written without spaces.',
    'A hyphen range must be the whole alternative: `1.2.3 - 2.3.4` works, but `1.2.3 - 2.3.4 <2.0.0` doesn’t.',
    'node-semver’s `loose` mode and coercion of strings like `1.2` to `1.2.0` aren’t supported; build metadata in ranges is ignored.',
    'Bumping drops any build metadata, and the **Prerelease id** must be a valid SemVer identifier (letters, digits and `-`).',
  ],
  privacy:
    'Everything runs in your browser, and nothing is uploaded or saved; the site’s Content Security Policy blocks requests to other servers, so no versions are looked up on the npm registry. **Copy share link** puts the range, the versions and the prerelease setting in the link’s `#` fragment, which browsers don’t send to servers. Text sent here from another tool with **Send to…** arrives through this tab’s session storage and is removed as soon as it is read.',
  faqs: [
    {
      question: 'What is the difference between ^ and ~?',
      answer:
        '`^1.2.3` allows any `1.x.x` from `1.2.3` up, so minor and patch updates. `~1.2.3` allows only `1.2.x` from `1.2.3`, so patch updates. Below 1.0.0 the caret is stricter: `^0.2.3` means `>=0.2.3 <0.3.0-0`.',
    },
    {
      question: 'Why doesn’t 2.0.0-beta.1 satisfy >=1.0.0?',
      answer:
        'npm only lets a prerelease match a range that mentions a prerelease of the same `major.minor.patch`, so you don’t get unstable versions by accident. Tick **Include prereleases** to match them anyway.',
    },
    {
      question: 'What does the -0 in <2.0.0-0 mean?',
      answer:
        '`2.0.0-0` is the lowest possible prerelease of 2.0.0. Using it as the upper bound excludes 2.0.0 and all its prereleases, such as `2.0.0-alpha`.',
    },
    {
      question: 'Is 1.0.0-alpha.10 newer than 1.0.0-alpha.9?',
      answer:
        'Yes. Numeric prerelease identifiers are compared as numbers, so 10 is greater than 9. Text identifiers are compared in ASCII order, and a numeric identifier is always lower than a text one.',
    },
    {
      question: 'Does build metadata like +build.5 affect matching?',
      answer:
        'No. SemVer ignores build metadata for precedence, so `1.2.3+build.5` sorts and matches exactly like `1.2.3`.',
    },
    {
      question: 'Does this behave exactly like npm?',
      answer:
        'It follows node-semver’s documented range grammar and prerelease rules, including `~>`, x-ranges and hyphen ranges. It doesn’t offer node-semver’s loose parsing or version coercion, so partial versions like `1.2` are rejected in the version list.',
    },
  ],
};

export default docs;
