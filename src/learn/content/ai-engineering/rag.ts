import type { Topic } from "../../types/content";
import { md } from "./md";

export const aiRagTopics: Topic[] = [
  {
    id: "document-loading",
    title: "Loading and Parsing Documents",
    level: "intermediate",
    description: "Turning PDFs, HTML, Markdown, tables and scanned pages into clean text plus metadata - the first and most underrated step of every RAG pipeline.",
    explanation: md(
      "A RAG system can only retrieve what it has ingested, and it can only ingest what it can read. **Document loading** (also called *parsing* or *extraction*) is the step that turns your raw files - PDFs, web pages, Word documents, Markdown, wiki exports, spreadsheets - into plain **text** plus **metadata** that the rest of the pipeline can chunk, embed and search.",
      "It sounds boring, and that is exactly why it is the most common hidden cause of bad RAG answers. If a PDF's two columns get interleaved line by line, if a table becomes a soup of numbers, or if every page starts with the same header and footer, the chunks you embed are garbage, and no clever retrieval later can fix that. The rule of thumb: **garbage in, garbage retrieved**.",
      "**What each format gives you:**",
      "- **Plain text and Markdown** - easiest. The text is already there; Markdown also gives you *structure* (headings `#`, lists, code blocks) that you can keep for smarter chunking later.\n- **HTML** - the text is mixed with tags, menus, cookie banners, scripts and footers. You must extract the main content and drop the *boilerplate* (repeated navigation and chrome that appears on every page).\n- **PDF** - a PDF is a description of where to *draw* characters on a page, not a document with paragraphs. A text extractor (such as the Python library `pypdf`) reassembles the characters into lines, but reading order, columns, hyphenation and tables can come out scrambled.\n- **Scanned PDFs and images** - contain no text at all, only pictures of text. You need **OCR** (optical character recognition: software that recognises letters in an image) to get text out. If a PDF extractor returns an empty string for a page, it is probably scanned.\n- **Office files (DOCX, PPTX, XLSX)** - structured XML underneath; dedicated libraries read them reliably.",
      "**Metadata** is data *about* each piece of text: which file it came from, the page number, the section heading, the author, the date, the URL, the department that owns it, who is allowed to read it. You attach it at load time and carry it all the way through the pipeline. Metadata is what lets you later **cite sources** ('handbook.pdf, page 12'), **filter** searches ('only 2025 policies'), **enforce permissions** ('only documents the HR team may see') and **re-index** a single file when it changes.",
      "**Cleaning** is the step right after extraction. Typical cleaning operations:",
      "- Normalise whitespace (collapse runs of spaces, at most one blank line between paragraphs).\n- Re-join words hyphenated across line breaks (`retriev-\\nal` becomes `retrieval`).\n- Remove repeated headers, footers and page numbers that appear on every page.\n- Remove boilerplate such as navigation menus, 'Accept cookies' text and share buttons from HTML.\n- Fix encoding problems (odd characters such as `â€™` where an apostrophe should be) and remove invisible characters such as soft hyphens.\n- Drop near-empty pages and exact duplicate documents.",
      "**Tables** need special care. A table flattened into one line ('Plan Price Seats Basic 10 1 Pro 30 5') loses the link between a header and its value. A better approach is to convert each row into a self-describing sentence or Markdown row: 'Plan: Pro; Price: 30; Seats: 5'. Then any chunk containing that row still makes sense on its own.",
      "The output of this step is a list of **documents** (or *pages* / *sections*), each with `text` and `metadata`. That list is the input to chunking.",
    ),
    analogy:
      "Document loading is like a librarian receiving a delivery of books, photocopies, printed web pages and faxes. Before anything can be shelved, they must be unpacked, the coffee-stained cover pages thrown away, the faxes typed up (OCR), and a catalogue card written for each item: title, author, date, which shelf, who may borrow it. A library with no catalogue cards (metadata) and smudged pages (bad extraction) is useless, however clever the librarian is at finding things later.",
    examples: [
      {
        title: "Clean extracted text: whitespace, hyphenation, repeated headers",
        code: `// Pretend this came out of a PDF text extractor, two pages
const pages = [
  "ACME Corp - Employee Handbook      Page 1\\n\\nAll employees receive 25 days of paid\\nannual leave. Unused leave can be car-\\nried over, up to 5 days.\\n\\n\\n\\n",
  "ACME Corp - Employee Handbook      Page 2\\n\\nRemote work   is allowed up to 3 days\\nper week with manager approval.\\u00ad",
];

function findRepeatedFirstLines(pages) {
  // A first line that appears on most pages (ignoring digits) is a header
  const counts = {};
  for (const p of pages) {
    const first = p.split("\\n")[0].replace(/[0-9]+/g, "#").trim();
    counts[first] = (counts[first] || 0) + 1;
  }
  return Object.keys(counts).filter((line) => counts[line] >= Math.ceil(pages.length / 2));
}

function clean(text, headers) {
  const lines = text.split("\\n").filter((line) => {
    const normalized = line.replace(/[0-9]+/g, "#").trim();
    return !headers.includes(normalized);
  });
  return lines.join("\\n")
    .replace(/\\u00ad/g, "")              // invisible soft hyphens
    .replace(/(\\w)-\\n(\\w)/g, "$1$2")     // re-join car-\\nried -> carried
    .replace(/[ \\t]+/g, " ")              // collapse spaces
    .replace(/([^\\n])\\n([^\\n])/g, "$1 $2") // single newlines inside a paragraph -> space
    .replace(/\\n{3,}/g, "\\n\\n")           // at most one blank line
    .trim();
}

const headers = findRepeatedFirstLines(pages);
console.log("detected headers:", headers);
pages.forEach((p, i) => {
  console.log("--- page " + (i + 1) + " ---");
  console.log(clean(p, headers));
});`,
        explanation: "Real extractors produce exactly these problems. Detecting repeated lines across pages is a simple, effective way to drop headers and footers. Note how the hyphenated word 'car-ried' is restored, so a search for 'carried' can now match.",
        walkthrough: [
          { code: "findRepeatedFirstLines(pages)", explanation: "Looks at the first line of every page, replaces digits with # so 'Page 1' and 'Page 2' look the same, and keeps lines that repeat on at least half the pages." },
          { code: ".replace(/(\\w)-\\n(\\w)/g, \"$1$2\")", explanation: "Joins a word that the PDF split across two lines with a hyphen." },
          { code: ".replace(/([^\\n])\\n([^\\n])/g, \"$1 $2\")", explanation: "PDFs break lines at the page edge, not at sentence ends. Inside a paragraph we turn those line breaks back into spaces." },
          { code: ".replace(/\\n{3,}/g, \"\\n\\n\")", explanation: "Keeps paragraph breaks (one blank line) because chunkers use them as natural split points." },
        ],
      },
      {
        title: "HTML to text, Markdown sections and tables to sentences (with metadata)",
        code: `// 1) HTML: drop scripts, nav and footer, keep main content
const html = "<html><head><script>track()</script></head><body>" +
  "<nav>Home | Pricing | Login</nav>" +
  "<main><h1>Refund policy</h1><p>Refunds are issued within <b>14 days</b>.</p>" +
  "<p>Contact support&amp;billing for help.</p></main>" +
  "<footer>(c) ACME</footer></body></html>";

function htmlToText(h) {
  return h
    .replace(/<(script|style|nav|footer|header)[^>]*>[\\s\\S]*?<\\/\\1>/gi, "")
    .replace(/<\\/(p|h[1-6]|li|div)>/gi, "\\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .split("\\n").map((l) => l.trim()).filter(Boolean).join("\\n");
}
console.log(htmlToText(html));

// 2) Markdown: split by headings and keep the heading path as metadata
const markdown = "# Handbook\\nIntro text.\\n## Leave\\n25 days per year.\\n## Remote work\\nUp to 3 days a week.";
const sections = [];
let path = [];
for (const line of markdown.split("\\n")) {
  const m = line.match(/^(#+) (.*)$/);
  if (m) {
    path = path.slice(0, m[1].length - 1).concat(m[2]);
    sections.push({ text: "", metadata: { source: "handbook.md", section: path.join(" > ") } });
  } else if (sections.length) {
    sections[sections.length - 1].text += line;
  }
}
console.log(JSON.stringify(sections, null, 1));

// 3) Table rows -> self-describing sentences
const table = [["Plan", "Price", "Seats"], ["Basic", "10", "1"], ["Pro", "30", "5"]];
const [header, ...rows] = table;
for (const row of rows) {
  console.log(header.map((h, i) => h + ": " + row[i]).join("; "));
}`,
        explanation: "Regex HTML stripping is fine for a demo; in production use a real HTML parser (BeautifulSoup in Python) or a main-content extractor. The important ideas are: remove boilerplate, keep structure (headings) as metadata, and turn tables into rows that make sense on their own.",
      },
      {
        title: "Real loaders in Python: PDF pages with pypdf, HTML with BeautifulSoup",
        language: "python",
        code: `# pip install pypdf beautifulsoup4
from pathlib import Path
from pypdf import PdfReader
from bs4 import BeautifulSoup

def load_pdf(path: Path):
    reader = PdfReader(str(path))
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if not text.strip():
            print(f"warning: {path.name} page {page_number} has no text layer (scanned? needs OCR)")
            continue
        yield {"text": text, "metadata": {"source": path.name, "page": page_number, "type": "pdf"}}

def load_html(path: Path):
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()                      # drop boilerplate
    main = soup.find("main") or soup.body or soup
    title = soup.title.get_text(strip=True) if soup.title else path.stem
    yield {"text": main.get_text("\\n", strip=True),
           "metadata": {"source": path.name, "title": title, "type": "html"}}

def load_text(path: Path):
    yield {"text": path.read_text(encoding="utf-8", errors="replace"),
           "metadata": {"source": path.name, "type": path.suffix.lstrip(".")}}

LOADERS = {".pdf": load_pdf, ".html": load_html, ".htm": load_html, ".md": load_text, ".txt": load_text}

def load_folder(folder: str):
    for path in sorted(Path(folder).rglob("*")):
        loader = LOADERS.get(path.suffix.lower())
        if loader:
            yield from loader(path)

if __name__ == "__main__":
    docs = list(load_folder("docs"))
    print(len(docs), "documents/pages loaded")
    print(docs[0]["metadata"], docs[0]["text"][:200])`,
        explanation: "One loader per file type, each producing the same shape: {text, metadata}. Loading PDFs page by page means you keep the page number for citations. Pages with no text are reported instead of silently ignored, because they usually need OCR (for example with the Tesseract OCR engine) or a document-parsing service.",
      },
    ],
    howItWorks: md(
      "A loading pipeline has four stages: **discover** (list files from a folder, bucket, wiki or database), **extract** (format-specific parser turns bytes into text), **clean** (normalise and remove noise) and **annotate** (attach metadata).",
      "**PDF extraction** works by reading the drawing instructions in the file ('put glyph *A* at x=72, y=700') and grouping characters into words and lines by their positions. Simple extractors follow the order in the file, which is usually but not always the reading order. Multi-column layouts, sidebars and footnotes are where it goes wrong. Layout-aware parsers (and some vision-model-based parsers) look at positions on the page to recover columns and tables; they are slower but much more accurate on complex documents.",
      "**OCR** runs a recognition model over an image of the page and outputs text, often with a confidence score per word. Low-confidence pages are worth flagging for human review. Some modern LLMs can also read page images directly, which is useful for diagrams and messy scans, but it costs more per page than plain extraction.",
      "**Deduplication** is usually done with a **hash**: a short fingerprint computed from the text (for example SHA-256). Two documents with the same hash are identical, so you keep one. Storing the hash in metadata also lets you skip unchanged files when you re-ingest (see rag-in-production).",
      "Whatever the source, normalise everything into one shape - `{ text, metadata }` - so that chunking, embedding and storage code never needs to know whether something came from a PDF or a web page.",
    ),
    diagram: `  files / URLs / wiki / DB
            |
            v
 +---------------------+
 | discover            |  list sources
 +---------------------+
            v
 +---------------------+   pdf -> pypdf (+OCR)
 | extract (per type)  |   html -> parser
 +---------------------+   md/txt -> read
            v
 +---------------------+   whitespace, hyphens,
 | clean               |   headers, boilerplate
 +---------------------+
            v
 +---------------------+   source, page, section,
 | annotate metadata   |   date, owner, access
 +---------------------+
            v
   [{ text, metadata }, ...]  --> chunking`,
    whyItExists: md(
      "Your knowledge does not live in neat strings: it lives in PDFs, wikis, tickets and web pages built for human eyes. An LLM and an embedding model need clean text. Loading exists to bridge that gap, and metadata exists because answers are only trustworthy when you can say where they came from and who is allowed to see them.",
    ),
    whenToUse: md(
      "Every RAG pipeline needs this step. Invest in it heavily when your corpus has PDFs with columns or tables, scanned documents, or HTML pages with lots of navigation. Always look at a sample of extracted text by eye before building anything else - it is the cheapest debugging you will ever do.",
    ),
    whenNotToUse: md(
      "If your data is already structured (rows in a database, JSON from an API), do not flatten it into a document and parse it back: query it directly with SQL or a tool call (see tool-use). If the whole corpus is small and stable, you may be able to paste it into the prompt and skip retrieval entirely (see what-is-rag).",
    ),
    commonMistakes: [
      "Never looking at the extracted text, then blaming the embedding model for bad answers.",
      "Dropping metadata (file name, page, section, date) at load time, which makes citations and filtering impossible later.",
      "Silently skipping scanned pages that returned empty text instead of logging them for OCR.",
      "Leaving repeated headers, footers and navigation in every chunk, so every chunk looks similar to every query.",
      "Flattening tables into one long line so row values lose their column headers.",
      "Indexing the same document several times (copies, versions), which fills the top results with duplicates.",
      "Treating loader output as trusted: documents can contain hidden text and instructions aimed at the model (see ai-security).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run the cleaning demo and add a footer line 'Confidential - do not distribute' to both pages. Extend findRepeatedFirstLines to also detect repeated LAST lines and remove them." },
      { difficulty: "Easy", prompt: "Pick three real files you own (a PDF, a web page saved as HTML, a Markdown file). Extract their text with the Python loaders and read the first 1,000 characters of each. List every quality problem you see." },
      { difficulty: "Medium", prompt: "Extend the Markdown section parser to keep code blocks (lines between ``` fences) intact, even if they contain lines that start with #." },
      { difficulty: "Medium", prompt: "Write a function that converts a CSV string (first row headers) into one self-describing sentence per row, and attach metadata {source, row} to each." },
      { difficulty: "Hard", prompt: "Build a loader that computes a SHA-256 hash of each document's cleaned text, skips exact duplicates, and prints a report: files loaded, pages with no text, duplicates skipped." },
    ],
    interviewQuestions: [
      { question: "Why is document parsing often the biggest quality lever in RAG?", answer: "Every later step works on the extracted text. Scrambled reading order, merged columns, lost table structure or repeated boilerplate produce chunks that embed poorly and read badly, so retrieval returns the wrong things and the model gets confusing context. Fixing extraction often improves answers more than changing the embedding model or the LLM." },
      { question: "How do you handle scanned PDFs?", answer: "Detect them (the text extractor returns little or no text per page), then run OCR or a document-parsing service that renders the page as an image and recognises the text. Log OCR confidence and route low-confidence pages to review. Some multimodal LLMs can read page images directly, which helps for diagrams, at a higher per-page cost." },
      { question: "What metadata would you attach to each document and why?", answer: "Source identifier and path or URL (for citations and re-indexing), page or section (for precise citations), title, dates such as last-modified (for freshness and filters), owner or department and access-control info (for permission filtering), document type, and a content hash (for deduplication and change detection)." },
      { question: "How would you represent a table for retrieval?", answer: "Keep each row together with its column headers, for example as 'Plan: Pro; Price: 30; Seats: 5' or a Markdown table row with the header repeated in the chunk. Optionally add the table caption. Large tables are better stored in a database and queried with SQL, with only a description of the table indexed for retrieval." },
      { question: "How do you remove boilerplate from web pages?", answer: "Parse the HTML, drop script, style, nav, header, footer and aside elements, prefer the main or article element, and remove lines that repeat across many pages of the same site. Main-content extraction libraries automate this." },
      { question: "Why normalise all loaders to one output shape?", answer: "So that chunking, embedding, storage and citation code is format-agnostic. Each new source type only needs a new loader that returns {text, metadata}, and the rest of the pipeline stays unchanged and testable." },
    ],
    prerequisites: ["what-is-rag", "embeddings"],
    relatedTopics: ["chunking", "building-a-rag-pipeline", "rag-in-production", "ai-security"],
    keywords: ["document loading", "parsing", "pdf extraction", "pypdf", "ocr", "html to text", "boilerplate", "metadata", "cleaning", "tables", "deduplication", "ingestion"],
  },

  {
    id: "chunking",
    title: "Chunking Strategies",
    level: "intermediate",
    description: "Splitting documents into retrievable pieces: fixed-size, overlap, recursive, structure-aware and semantic chunking, and how to choose a chunk size.",
    explanation: md(
      "After loading, you have documents that may be dozens or hundreds of pages long. You cannot embed a whole book as one vector and expect search to work, and you do not want to paste a whole book into every prompt. **Chunking** splits each document into smaller pieces called **chunks**; each chunk is embedded, stored and retrieved on its own.",
      "Why not embed whole documents? An embedding is a single vector that summarises the meaning of its text (see embeddings). A vector for a 50-page handbook is a blurry average of holidays, expenses, security and parking. A question about parking matches it weakly, and even if it is retrieved you would have to send all 50 pages to the model. Smaller chunks give **sharper vectors** and **less irrelevant text** in the prompt.",
      "Why not tiny chunks, then? A single sentence like 'It is limited to 5 days.' has lost its context: *what* is limited? Chunks that are too small match queries but do not contain enough information to answer them. Chunk size is a trade-off between **precision** (small, focused chunks match the query sharply) and **context** (large chunks carry enough surrounding information to be understood).",
      "**The main strategies:**",
      "- **Fixed-size chunking** - cut every N characters, words or tokens. Simple and predictable, but it cuts through sentences and ideas.\n- **Overlap** - each chunk repeats the last part of the previous one (for example 800 characters with 150 overlap). A fact that straddles a boundary then appears whole in at least one chunk. Overlap costs extra storage and embedding, and can produce near-duplicate results.\n- **Recursive chunking** - try to split on the biggest natural boundary first (blank lines between paragraphs), and only if a piece is still too big, split it on smaller boundaries (single newlines, then sentences, then words). This keeps paragraphs and sentences intact whenever possible and is a strong default.\n- **Structure-aware chunking** - use the document's own structure: Markdown headings, HTML sections, PDF pages, code functions, FAQ question-answer pairs. Each section becomes a chunk (split further if too long), and the **heading path** ('Handbook > Leave > Carry-over') is stored as metadata and often prepended to the chunk text so the chunk is self-explanatory.\n- **Semantic chunking** - embed each sentence and start a new chunk where the meaning shifts (where similarity between neighbouring sentences drops). It follows topics instead of lengths, at the cost of an embedding call per sentence during ingestion.",
      "**Sizing rules of thumb.** Sizes are usually measured in **tokens** (see tokens-and-context-windows); for English text one token is roughly four characters. Common starting points are a few hundred tokens per chunk (roughly 200-800) with 10-20% overlap. Q&A over policies and FAQs favours smaller chunks; summarising or reasoning over long arguments favours bigger ones. Embedding models also have a maximum input length; text beyond it is silently truncated, so chunks must stay under that limit (small local models such as all-MiniLM-L6-v2 were trained on short passages, so keep chunks for them short).",
      "**Every chunk carries metadata**: the source document's metadata plus its own position (chunk index, page, section, character offsets). That is how you cite, filter, deduplicate and re-index later.",
      "There is no universally best chunk size. Pick a sensible default (recursive, ~500 tokens, ~15% overlap, headings prepended), then measure retrieval quality on real questions and adjust (see evaluating-rag).",
    ),
    analogy:
      "Chunking is like cutting a long film into scenes for a highlights search. Cut into single frames and nobody can tell what is happening in any of them. Keep the whole film as one clip and every search returns two hours of footage. Cutting at scene changes (structure-aware or semantic) works best, and letting each clip start a few seconds before the previous one ends (overlap) means no line of dialogue is lost at a cut.",
    examples: [
      {
        title: "Fixed-size chunks with and without overlap",
        code: `const text = "Our refund policy is simple. Customers can request a refund within " +
  "30 days of purchase. Refunds go back to the original payment method. " +
  "Digital downloads are not refundable once opened. Contact support to start a refund.";

function chunkWords(text, size, overlap) {
  if (overlap >= size) throw new Error("overlap must be smaller than size");
  const words = text.split(/\\s+/).filter(Boolean);
  const chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    chunks.push({ index: chunks.length, startWord: start, text: words.slice(start, start + size).join(" ") });
    if (start + size >= words.length) break;   // last window reached the end
  }
  return chunks;
}

const fact = "within 30 days of purchase";
for (const overlap of [0, 4]) {
  const chunks = chunkWords(text, 12, overlap);
  console.log("size=12 words, overlap=" + overlap + " -> " + chunks.length + " chunks");
  for (const c of chunks) console.log("  [" + c.index + "] " + c.text);
  const whole = chunks.some((c) => c.text.includes(fact));
  console.log("  fact '" + fact + "' intact in some chunk? " + whole + "\\n");
}`,
        explanation: "Without overlap the key fact is cut in half at a chunk boundary, so no single chunk contains '30 days of purchase' together with 'refund within'. With a 4-word overlap the fact survives intact in one chunk. Real systems measure in tokens or characters, but the mechanism is the same.",
        walkthrough: [
          { code: "start += size - overlap", explanation: "The window moves forward by size minus overlap, so consecutive chunks share 'overlap' words." },
          { code: "if (overlap >= size) throw ...", explanation: "Guard: if overlap were as big as the chunk, the window would never move forward - an infinite loop." },
          { code: "if (start + size >= words.length) break;", explanation: "Stop once a window has reached the end, otherwise the overlap would create tiny useless trailing chunks." },
          { code: "chunks.some((c) => c.text.includes(fact))", explanation: "A quick test of what overlap is for: is the boundary-crossing fact fully present anywhere?" },
        ],
      },
      {
        title: "Recursive splitter that respects paragraphs and sentences",
        code: `function recursiveSplit(text, maxLen, seps) {
  seps = seps || ["\\n\\n", "\\n", ". ", " "];
  if (text.length <= maxLen) return [text];
  if (seps.length === 0) {                       // last resort: hard cut
    const out = [];
    for (let i = 0; i < text.length; i += maxLen) out.push(text.slice(i, i + maxLen));
    return out;
  }
  const [sep, ...rest] = seps;
  const chunks = [];
  let current = "";
  for (const part of text.split(sep)) {
    const candidate = current ? current + sep + part : part;
    if (candidate.length <= maxLen) { current = candidate; continue; }  // keep packing
    if (current) chunks.push(current);
    if (part.length > maxLen) {                   // this piece alone is too big: go finer
      chunks.push(...recursiveSplit(part, maxLen, rest));
      current = "";
    } else {
      current = part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const doc = "Leave policy\\n\\nEmployees get 25 days of annual leave. Up to 5 unused days carry over. " +
  "Carry-over days expire on 31 March.\\n\\nSick leave\\n\\nSick leave is unlimited but needs a note after 3 days.\\n\\n" +
  "Remote work\\n\\nYou may work remotely up to 3 days a week with approval.";

recursiveSplit(doc, 90).forEach((c, i) => console.log(i, "(" + c.length + " chars)", JSON.stringify(c)));`,
        explanation: "Short paragraphs are packed together until the limit; a paragraph that is too long is split at sentence boundaries instead of mid-word. This is the idea behind the popular 'recursive character text splitter' found in many RAG libraries. Look closely at the output for two flaws real splitters handle: the '. ' separator is consumed, so a chunk can lose its final full stop (production splitters keep separators attached), and the heading 'Remote work' is packed at the end of the previous chunk, separated from its own text. The next example fixes the heading problem by chunking on structure.",
      },
      {
        title: "Structure-aware chunks with the heading path prepended",
        code: `const markdown = [
  "# Employee Handbook",
  "## Leave",
  "Employees get 25 days of annual leave.",
  "### Carry-over",
  "Up to 5 unused days carry over. They expire on 31 March.",
  "## Expenses",
  "Submit receipts within 30 days. Meals are capped at 40 per day.",
].join("\\n");

function chunkByHeadings(md, source) {
  const chunks = [];
  let path = [];
  let body = [];
  const flush = () => {
    if (body.length === 0) return;
    const section = path.join(" > ");
    chunks.push({
      text: section + "\\n" + body.join(" "),          // heading context travels with the text
      metadata: { source: source, section: section, chunk: chunks.length },
    });
    body = [];
  };
  for (const line of md.split("\\n")) {
    const m = line.match(/^(#{1,6}) (.+)$/);
    if (m) { flush(); path = path.slice(0, m[1].length - 1).concat(m[2]); }
    else if (line.trim()) body.push(line.trim());
  }
  flush();
  return chunks;
}

for (const c of chunkByHeadings(markdown, "handbook.md")) {
  console.log(JSON.stringify(c.metadata));
  console.log("  " + c.text.replace("\\n", " | "));
}`,
        explanation: "The chunk 'Up to 5 unused days carry over' is ambiguous alone; with 'Employee Handbook > Leave > Carry-over' prepended, both the embedding and the LLM know it is about annual leave. Long sections would additionally be passed through the recursive splitter, each piece keeping the same heading prefix.",
      },
      {
        title: "Semantic chunking with sentence-transformers (Python)",
        language: "python",
        code: `# pip install sentence-transformers numpy
import re
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")   # 384-dimensional vectors

def semantic_chunks(text: str, threshold: float = 0.45, max_sentences: int = 12):
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\\s+", text) if s.strip()]
    if not sentences:
        return []
    vectors = model.encode(sentences, normalize_embeddings=True)
    chunks, current = [], [sentences[0]]
    for i in range(1, len(sentences)):
        similarity = float(np.dot(vectors[i - 1], vectors[i]))   # cosine, since normalised
        topic_shift = similarity < threshold
        if topic_shift or len(current) >= max_sentences:
            chunks.append(" ".join(current))
            current = []
        current.append(sentences[i])
    chunks.append(" ".join(current))
    return chunks

text = ("Annual leave is 25 days. Unused leave can carry over up to 5 days. "
        "The office kitchen is cleaned every Friday. Please label your food in the fridge.")
for c in semantic_chunks(text):
    print("-", c)`,
        explanation: "Adjacent sentences about the same topic have similar embeddings; a drop in similarity marks a topic change and starts a new chunk. The threshold must be tuned per corpus and embedding model, and a max size still applies so a long single-topic section does not become one giant chunk.",
      },
    ],
    howItWorks: md(
      "All chunkers share a loop: walk through the text, accumulate units (characters, tokens, words, sentences or sections) until a size limit or a boundary is reached, emit a chunk with metadata, then step back by the overlap and continue.",
      "**Measuring size.** Character counts are fast and predictable; token counts match what the embedding model and LLM actually see. A practical approach is to chunk by characters with a conservative limit, or use the embedding model's own tokenizer to count tokens exactly.",
      "**Recursive splitting** is a divide-and-conquer algorithm: split by the coarsest separator, greedily pack consecutive pieces up to the limit, and recurse with finer separators only on pieces that are still too big. The result respects natural boundaries whenever it can.",
      "**Overlap** is applied when moving to the next chunk: the new chunk starts `overlap` units before the previous one ended. With chunk size S and overlap O, a document of length L produces roughly (L - O) / (S - O) chunks, so 20% overlap means about 25% more chunks to embed and store.",
      "**Contextual enrichment.** Because chunks are retrieved in isolation, it helps to make each one self-contained: prepend the document title and heading path, or (a more advanced technique) have an LLM write a one-sentence context for each chunk before embedding it (see advanced-rag-techniques).",
      "**Parent-child chunking** separates what you *search* from what you *send*: you embed small chunks for precise matching, but when one matches you send its larger parent section to the LLM (also covered in advanced-rag-techniques).",
    ),
    diagram: `document (8 pages)
|====================================================|

fixed-size, no overlap:
|--c0--|--c1--|--c2--|--c3--|--c4--|--c5--|--c6--|
         ^ a fact cut in half at a boundary

fixed-size with overlap:
|--c0--|
     |--c1--|
          |--c2--|        each chunk repeats the
               |--c3--|   tail of the previous one

structure-aware:
| # Intro | ## Leave | ### Carry-over | ## Expenses |
   c0         c1          c2              c3
 + heading path stored in metadata / prepended`,
    whyItExists: md(
      "Embedding models produce one vector per input and work best on focused passages; LLM prompts have a finite context window and every token costs money and attention. Chunking is the compromise that makes large document collections searchable at a useful granularity: small enough to match precisely, big enough to be understood.",
    ),
    whenToUse: md(
      "Whenever documents are longer than a few paragraphs. Start with recursive chunking plus heading prefixes for prose, structure-aware chunking for Markdown, HTML, FAQs and code, and consider semantic chunking for long unstructured text where topics drift. Tune size and overlap with a retrieval evaluation set, not by intuition.",
    ),
    whenNotToUse: md(
      "Do not chunk items that are already small and self-contained: a product description, a support ticket, an FAQ entry, a single row - index each as one unit. Do not split code in the middle of a function or a table in the middle of a row. If the entire corpus fits comfortably in the prompt, you may not need chunking (or retrieval) at all.",
    ),
    commonMistakes: [
      "Using one huge chunk per document, which produces blurry embeddings and stuffs the prompt with irrelevant text.",
      "Using tiny chunks (single sentences) that match queries but lack the context needed to answer.",
      "Setting overlap greater than or equal to chunk size, which causes an infinite loop or massive duplication.",
      "Exceeding the embedding model's maximum input length, so the end of each chunk is silently truncated and never searchable.",
      "Losing headings and titles, so a chunk like 'This is capped at 5 days' has no subject.",
      "Not storing chunk position metadata (page, section, index), making citations and neighbour expansion impossible.",
      "Choosing a chunk size once by gut feeling and never measuring retrieval quality.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "In the fixed-size demo, find the smallest overlap (in words) that keeps the fact intact for size 12. Then try size 8 and repeat." },
      { difficulty: "Easy", prompt: "Compute how many chunks a 100,000-character document produces with size 1,000 and overlap 0, 100 and 200 characters, using (L - O) / (S - O)." },
      { difficulty: "Medium", prompt: "Modify recursiveSplit to add overlap: each chunk after the first should start with the last 20 characters of the previous chunk, cut at a word boundary." },
      { difficulty: "Medium", prompt: "Combine the two later demos: chunk by headings, then pass any section body longer than 80 characters through recursiveSplit, prefixing every piece with its heading path." },
      { difficulty: "Hard", prompt: "Build a code-aware chunker for JavaScript source: split at top-level 'function' declarations so each function is one chunk, with metadata {file, functionName, startLine}." },
      { difficulty: "Hard", prompt: "Take 20 real questions about a document you own. Chunk it at 200, 500 and 1,000 tokens, retrieve top-3 for each question with the Python embedding code, and record how often the chunk containing the answer appears. Which size wins?" },
    ],
    interviewQuestions: [
      { question: "How do you choose chunk size?", answer: "Start from a sensible default (a few hundred tokens with 10-20% overlap, boundaries at paragraphs/sections), stay under the embedding model's input limit, then measure: build a set of real questions with known answer locations and compare recall@k across sizes. Smaller chunks give precise matches for fact lookups; larger ones keep context for reasoning-heavy questions." },
      { question: "What problem does overlap solve, and what does it cost?", answer: "It prevents information that spans a chunk boundary from being split so that no chunk contains it whole. The cost is more chunks to embed and store (about S/(S-O) times as many) and near-duplicate results that can crowd the top-k, which you can mitigate by deduplicating or merging adjacent hits." },
      { question: "What is recursive chunking?", answer: "Splitting with a hierarchy of separators: try paragraph breaks first, greedily pack pieces up to the size limit, and only split oversized pieces further by line, sentence, then word. It keeps natural units intact while guaranteeing a maximum size." },
      { question: "Why prepend headings or titles to chunks?", answer: "Chunks are retrieved in isolation. A chunk like 'Up to 5 days carry over' does not say what it refers to; adding 'Handbook > Annual leave > Carry-over' makes the embedding match leave-related queries and lets the LLM interpret it correctly." },
      { question: "When would you use semantic chunking?", answer: "For long unstructured text where topic boundaries do not align with formatting, such as transcripts or essays. It embeds sentences and splits where adjacent-sentence similarity drops. It costs more at ingestion and needs a tuned threshold plus a size cap." },
      { question: "How should code and tables be chunked?", answer: "By their structure: code at function or class boundaries (often using a parser), tables by rows with headers repeated in each chunk, or stored in a database and queried rather than embedded. Splitting them mid-unit destroys meaning." },
    ],
    prerequisites: ["document-loading", "embeddings", "tokens-and-context-windows"],
    relatedTopics: ["vector-databases", "building-a-rag-pipeline", "advanced-rag-techniques", "evaluating-rag"],
    keywords: ["chunking", "chunk size", "overlap", "recursive text splitter", "semantic chunking", "structure-aware chunking", "markdown headings", "parent-child", "tokens", "text splitting"],
  },
];
