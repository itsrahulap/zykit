// User docs for Architecture Diagram Builder, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Start from "Load a sample…" (web app, queue-based system or frontend/API/database), or press New for an empty canvas.',
    'Add nodes with "Add node" (frontend, service, database, cache, queue, external API or generic) and boundaries with "Add group". Drag them, or Tab to one and move it with the arrow keys (Shift for bigger steps).',
    'Connect nodes: turn on Connect and pick the source then the target, or select a node and use "Add an edge to" in the Properties panel.',
    'Edit labels and kinds in the Properties panel. Delete or Backspace removes the selection; Ctrl/⌘+Z undoes and Shift+Ctrl/⌘+Z or Ctrl+Y redoes.',
    'Copy the Mermaid flowchart, or download SVG, PNG or JSON. "Import JSON" opens a diagram you exported earlier.',
  ],
  howItWorks:
    'The diagram is a small data model (nodes, directed edges and group rectangles) drawn as SVG by the page itself, with no diagram library. Every edit produces a new copy of the model, which is what makes undo and redo (up to 100 steps) cheap; a whole drag counts as one step. A node belongs to a group when its centre is inside the group, so moving a group moves those nodes. Mermaid, SVG and JSON exports are generated from the model, never from the page’s DOM, and PNG is drawn by loading that generated SVG into an image and painting it onto a canvas. Everything runs on the main thread in your browser.',
  limits: [
    'Up to 200 nodes, 500 edges and 50 groups per diagram; labels are single-line and at most 80 characters.',
    'Imported JSON must use the tool’s own format (version 1) and be under 2 MB. Every field is checked: unknown kinds, duplicate or malformed ids, edges to missing nodes, self-loops and duplicate edges are rejected, and coordinates are clamped to ±20,000.',
    'Edges are straight lines; there is no automatic layout or edge routing, and groups don’t nest (in Mermaid a node goes into the smallest group containing it).',
    'PNG export is drawn at 2× and scaled down so neither side exceeds 8,192 pixels.',
    'There is no pinch-to-zoom; use the zoom buttons or Ctrl/⌘ + scroll.',
  ],
  privacy:
    'Everything happens in your browser. The current diagram is saved in this browser’s localStorage so it survives a reload, and is re-validated when it is read back. Imported files are read locally, and exports are downloaded straight from the page. Nothing is uploaded or sent anywhere.',
  faqs: [
    {
      question: 'Can I paste the Mermaid output into GitHub or a Markdown file?',
      answer:
        'Yes. It is a standard "flowchart LR" with quoted labels. Characters that would break Mermaid syntax, such as quotes, brackets and pipes, are written as Mermaid entity codes like #34;, and node ids are generated (n1, n2, …) so labels never collide with keywords such as "end".',
    },
    {
      question: 'Is it safe to import a diagram file someone sent me?',
      answer:
        'The file is treated as untrusted. Only known fields are copied, counts and label lengths are capped, and labels are only ever shown as plain text inside SVG, so a label containing HTML or SVG markup is displayed literally rather than run.',
    },
    {
      question: 'How do I use it without a mouse?',
      answer:
        'Tab moves between nodes and groups on the canvas and selects them; arrow keys move the selection (Shift for 50 px steps), Delete removes it and Enter picks it in Connect mode. Labels, kinds, group sizes and new edges are all editable in the Properties panel, and arrow keys on the empty canvas pan the view.',
    },
    {
      question: 'Where is my diagram saved?',
      answer:
        'In your browser’s localStorage, on this device only. Clearing site data removes it, so download the JSON if you want a copy you can import later or share.',
    },
  ],
};

export default docs;
