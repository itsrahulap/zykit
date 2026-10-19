import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a sample of your JSON into **Input JSON**, drop a file on it, or use **Open file**. **Try an example** loads a sample.',
    'Pick a **Language**: Go, Python, Rust, Java, C#, Kotlin, or a **Zod** or **Valibot** schema for TypeScript. Python, Java and C# also offer a style (dataclass or Pydantic v2, record or POJO, record or class); the schemas offer **Strict objects**, which reject keys that aren’t in the sample.',
    'Set the **Root name** and, for the typed languages, choose **Field names**: the language’s own convention, or the JSON names kept as they are. Schemas always use the JSON keys.',
    'Copy the code, use **Download** (the file gets the right extension), or send it to another tool.',
  ],
  howItWorks:
    'The JSON is read with the JSON Formatter’s strict parser, and a shape is inferred from the values the same way as in JSON to TypeScript. All items of an array are merged into one shape. A key missing from some items is optional, a key that is sometimes `null` is nullable, and a position with different kinds of values (for example a string and a number) becomes the language’s “any” type. Whole numbers become integers; numbers with a fraction or exponent become floating point.\n\n' +
    'Each object becomes a named type. Nested types are named after their key in PascalCase, and array items use the singular form of the key. Objects with exactly the same fields share one type. Each language then renders the model:\n\n' +
    '- Go structs with `json` tags (`omitempty` for optional keys, pointers for nullable ones)\n- Python dataclasses or Pydantic v2 models\n- Rust structs with serde derives and `Option<T>`\n- Java records or POJOs with Jackson annotations\n- C# records or classes with `System.Text.Json` attributes\n- Kotlin data classes with kotlinx.serialization\n- Zod schemas (`z.object`, `.nullable()`, `.optional()`) with `z.infer` types, written for Zod 3.23 and later, including Zod 4\n- Valibot schemas (`v.object`, `v.nullable`, `v.optional`, `v.pipe(v.number(), v.integer())`) with `v.InferOutput` types, written for Valibot 1.x\n\n' +
    'Keys that aren’t valid identifiers, or whose idiomatic name differs from the key, get a rename annotation (`json` tag, `alias`, `serde(rename)`, `@JsonProperty`, `JsonPropertyName`, `@SerialName`).',
  limits: [
    'Input is limited to about 5 MB (5 million characters); opened or dropped files to 10 MB.',
    'Types only describe the sample you paste. A field that is always `null` or only appears in an empty array becomes the language’s “any” type (`any`, `Any`, `serde_json::Value`, `Object`, `object`, `JsonElement`).',
    'Integers are 64-bit (`int64`, `long`, `Long`, `i64`) and everything else numeric is a 64-bit float. Date strings stay strings.',
    'Python dataclasses can’t rename keys, so a renamed field gets a comment with its JSON key; use Pydantic for aliases.',
    'Optional Go fields use `omitempty`, so a zero value (`0`, `false`, empty string) is left out when encoding. Nullable items inside an array are not marked nullable.',
    'Java output has one public type per file: only the root is `public`, so save the file under the root’s name (the download does).',
    'Nesting deeper than 200 levels becomes the “any” type.',
    'Zod and Valibot schemas are generated as text and never run here. One sample can’t show every optional field, union or format (email, date, URL), so review the schema before relying on it for validation. Unknown values become `unknown()`.',
  ],
  privacy:
    'Code is generated entirely in your browser; your JSON is never uploaded or stored. **Share** copies a link with your input and options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. If you use **Send to…** or receive JSON from another tool, it is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why is a Go field a pointer?',
      answer:
        'A key whose value is sometimes `null` becomes a pointer (`*string`) so `nil` can mean null. Slices and `any` can already be nil, so they stay as they are. Keys missing from some objects get `omitempty` instead.',
    },
    {
      question: 'Should I use a Python dataclass or Pydantic?',
      answer:
        'Pydantic v2 validates and converts JSON for you and supports aliases for keys like `site-url`. Dataclasses are plain and have no dependencies, but you must map the keys to fields yourself.',
    },
    {
      question: 'Why do some fields have a rename annotation?',
      answer:
        'Languages prefer their own naming (`snake_case` in Python and Rust, `camelCase` in Java and Kotlin, `PascalCase` in Go and C#), so the JSON key is recorded in an annotation. Choose **Keep JSON names** to use the keys as they are where the language allows it.',
    },
    {
      question: 'What happens when the JSON root is an array?',
      answer:
        'The items are merged into one type named after the root with an `Item` suffix, and languages with aliases add one for the array (`type Root []RootItem` in Go, `Root = list[RootItem]` in Python). Java and C# add a comment instead.',
    },
  ],
};

export default docs;
