import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a sample of your JSON into **Input JSON**, drop a file on it, or use **Open file**. **Try an example** loads a sample.',
    'Choose the **Declaration style**: **interface** or **type alias**.',
    'Set the **Root name** for the top-level type, and tick **export** or **readonly** to add those modifiers.',
    'Copy the generated types, use **Download .ts**, or send them to another tool.',
  ],
  howItWorks:
    'The JSON is read with the same strict parser as the JSON Formatter, and a type is inferred from the values it contains. Strings, numbers and booleans become `string`, `number` and `boolean`, and `null` becomes `null`. Each object becomes a named type. Nested types are named after their key in PascalCase (`user_profile` → `UserProfile`), and array items get the singular form of the key (`users` → `User`, `categories` → `Category`).\n\n' +
    'All items of an array are merged into one shape. A key missing from some items becomes optional (`nickname?: string`), a key that is sometimes `null` becomes a union like `string | null`, and items of different kinds give a union array such as `(string | number)[]`. Empty arrays become `unknown[]` and empty objects `Record<string, unknown>`. Objects with exactly the same fields share one named type, so `billing` and `shipping` addresses produce a single declaration.\n\n' +
    'Keys that aren’t valid identifiers, such as `site-url`, are written in quotes. Names that would shadow built-in globals such as `Date`, `Event` or `Response` get a `Type` suffix, and clashing names are numbered. A root that isn’t an object, such as an array or a string, becomes a `type` alias like `type Root = RootItem[]`. Types are generated in the page as you type.',
  limits: [
    'Input is limited to about 5 MB (5 million characters); opened or dropped files to 10 MB.',
    'Types only describe the sample you paste. A field that never appears, or is always `null`, can’t be typed more precisely than the data shows.',
    'Numbers are always `number`; there are no literal types, enums or `bigint`. Date strings stay `string`, with a note when some values look like ISO dates.',
    'Nesting deeper than 200 levels is typed `unknown`.',
    'Singular names are a best-effort English guess. When unsure, an `Item` suffix is added instead (for example `data` gives `DataItem`).',
    'If an object has a key twice, the last value is used, as with `JSON.parse`.',
  ],
  privacy:
    'Types are generated entirely in your browser; your JSON is never uploaded or stored. **Share** copies a link with your input and options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. If you use **Send to…** to open the types in another tool, or receive JSON from one, it is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why is a field optional in the generated type?',
      answer:
        'It’s missing from at least one item of the array it belongs to. Items are merged into one type, so a key that only some items have is marked with `?`. Add more complete sample data if the field is actually required.',
    },
    {
      question: 'How are null values typed?',
      answer:
        'As a union with the other types seen at that position, for example `email: string | null`. If a field is only ever `null` in your sample, its type is just `null`.',
    },
    {
      question: 'Why are dates typed as string?',
      answer:
        'JSON has no date type, so dates arrive as strings. The tool notes when values look like ISO dates. Convert them with `new Date(value)` after parsing if you need `Date` objects.',
    },
    {
      question: 'What is the difference between interface and type alias output?',
      answer:
        'The fields are identical. **interface** writes `interface User { … }` and **type alias** writes `type User = { … };`. A root that isn’t an object is always a `type` alias, because an interface can’t describe an array or a primitive.',
    },
    {
      question: 'Why do two objects share one type name?',
      answer:
        'They have exactly the same keys and field types, so one declaration is reused instead of generating identical copies. Objects with the same key name but different fields get separate, numbered names.',
    },
  ],
};

export default docs;
