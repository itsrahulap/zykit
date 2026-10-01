import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Direction**: **YAML → JSON** or **JSON → YAML**.',
    'Paste into the input, drop a file on it, or use **Open file**. Opening a `.yaml`/`.yml` or `.json` file picks the direction for you. **Try an example** fills in a sample.',
    'For YAML → JSON, choose the **JSON indent** and whether to convert **All documents as an array** when the input has several `---` documents.',
    'For JSON → YAML, choose the **Indent**, the **Line width** at which long strings are folded (or **No wrapping**), and how **Strings** are quoted.',
    'Copy or download the result, or press **Swap** to turn the output into the new input and convert it back.',
  ],
  howItWorks:
    'Both directions use the open-source `yaml` library, loaded the first time you convert. YAML is read with YAML 1.2 rules (the core schema), so `yes`, `no` and `on` stay strings, dates stay strings, and `0o17` and `0x1F` are numbers. Anchors and aliases (`&name`, `*name`) and merge keys (`<<`) are resolved, and duplicate keys are reported as errors. Errors show their line and column, and **Jump to error in input** moves the cursor there.\n\n' +
    'Some YAML has no JSON equivalent, and a notice says what was changed. Non-string keys such as `200` or `true` become string keys, and map or list keys are turned into strings. Custom tags like `!custom` are ignored and the plain value is kept. `.inf` and `.nan` become `null`. Comments are dropped. Several documents become one JSON array with **All documents as an array**; otherwise only the first is converted.\n\n' +
    'JSON → YAML parses the JSON with the browser’s standard parser and writes YAML with 1.1 quoting rules, so strings like `"yes"`, `"on"` or `"null"` are quoted and older YAML readers won’t turn them into booleans or null. Repeated objects are written out in full rather than as anchors. Conversion runs in the page as you type.',
  limits: [
    'Input is limited to about 20 MB (20 million characters); opened or dropped files to 10 MB.',
    'Alias expansion is limited (an alias count of 100, as measured by the YAML library) to stop “billion laughs” documents; one that goes over is reported as an error.',
    'Numbers are JavaScript numbers in both directions, so integers beyond 2^53 lose precision (`12345678901234567890` becomes `12345678901234567000`).',
    'YAML comments, custom tags and anchor names can’t be carried into JSON. JSON → YAML never produces comments or anchors.',
    'Output longer than 1 million characters is only partly shown on screen; copy or download to get all of it.',
  ],
  privacy:
    'Conversion happens entirely in your browser and files are read locally; nothing is uploaded or stored. The YAML library is part of this site and is loaded from it. **Share** copies a link with your input and options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. If you use **Send to…** to open the result in another tool, it is handed over through this tab’s session storage and removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Why did `yes` stay a string instead of becoming `true`?',
      answer:
        'YAML is read with YAML 1.2 rules, where only `true` and `false` are booleans. `yes`, `no`, `on` and `off` were booleans in YAML 1.1 only. When writing YAML, the tool quotes such strings so 1.1 readers (many CI tools, PyYAML) don’t misread them.',
    },
    {
      question: 'How are multiple YAML documents converted?',
      answer:
        'With **All documents as an array** on, every `---` document becomes one item of a JSON array. With it off, only the first document is converted and a notice tells you how many there were.',
    },
    {
      question: 'Are anchors and merge keys supported?',
      answer:
        'Yes. Aliases are replaced by a copy of the anchored value, and `<<: *defaults` merges the anchored map into the current one, with keys written next to it taking priority. The status line shows how many aliases were resolved.',
    },
    {
      question: 'Why does my YAML say duplicate key?',
      answer:
        'A map has the same key twice. YAML forbids this and JSON would silently keep only the last value, so the tool reports it with its line and column instead of guessing.',
    },
    {
      question: 'Where did my comments go?',
      answer: 'JSON has no comments, so YAML comments are dropped when converting to JSON. Converting back to YAML can’t restore them.',
    },
  ],
};

export default docs;
