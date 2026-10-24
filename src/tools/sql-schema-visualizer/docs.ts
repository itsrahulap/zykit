// User docs for SQL Schema Visualizer, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste PostgreSQL DDL (CREATE TABLE, CREATE INDEX and ALTER TABLE … ADD statements), open a .sql file, or try the example.',
    'Check the "Skipped or ignored" list: every statement or option the parser doesn’t support is listed with its line number.',
    'Pan, zoom and fit the ER diagram, or search for a table to highlight it and the tables it shares a foreign key with.',
    'Download the diagram as SVG or PNG, copy the Mermaid erDiagram, or open the schema in the PostgreSQL Query Builder.',
  ],
  howItWorks:
    'A small tokenizer splits the SQL into words, quoted identifiers, strings (including E-strings and dollar quotes) and punctuation, skipping -- and nested /* */ comments, so semicolons inside strings never split a statement. A parser then reads the supported DDL subset into a model of tables, columns, keys, indexes and foreign keys. Tables are laid out in layers by foreign-key dependency (referenced tables on the left) and drawn as SVG. The SVG, PNG and Mermaid exports are generated from that model, with every name escaped for the target format.',
  limits: [
    'Supported: CREATE TABLE (IF NOT EXISTS, TEMP/UNLOGGED), column types with parameters and arrays, NOT NULL, NULL, DEFAULT, PRIMARY KEY, UNIQUE, REFERENCES, CHECK, GENERATED … AS IDENTITY, COLLATE; table PRIMARY KEY, UNIQUE, FOREIGN KEY (composite) and CHECK with CONSTRAINT names; CREATE [UNIQUE] INDEX; ALTER TABLE … ADD CONSTRAINT/COLUMN.',
    'Everything else (views, functions, types, sequences, EXCLUDE constraints, PARTITION OF, ALTER TABLE … DROP, and so on) is listed with its line number and skipped, not guessed.',
    'Input is capped at 1 million characters and 500 tables. PNG export is limited to about 40 megapixels; use SVG for larger diagrams.',
    'Only explicit foreign keys are drawn. Name-based matches such as customer_id → customers.id are listed separately as suggestions.',
    'The Query Builder supports 13 column types and single-column relationships, so other types become TEXT and composite foreign keys are left out; the tool lists each change before you open it.',
  ],
  privacy:
    'Your SQL is parsed and drawn entirely in your browser. Nothing is uploaded and no database is contacted. "Open in Query Builder" saves the converted schema in this browser’s local storage, where the Query Builder reads it.',
  faqs: [
    {
      question: 'Why is a relationship missing from the diagram?',
      answer:
        'Lines are drawn only for explicit foreign keys: REFERENCES on a column, FOREIGN KEY in the table, or ALTER TABLE … ADD FOREIGN KEY. A foreign key to a table that isn’t in the pasted SQL is reported instead of drawn. Columns that only look related by name appear under "Possible relationships".',
    },
    {
      question: 'Does it support MySQL or SQL Server syntax?',
      answer:
        'It targets PostgreSQL. Standard CREATE TABLE statements from other databases often work, but things like backtick identifiers, AUTO_INCREMENT or bracketed names are reported as unsupported rather than guessed.',
    },
    {
      question: 'How do I get the schema from my database?',
      answer:
        'Run pg_dump --schema-only your_database and paste the output. Statements the diagram doesn’t need, such as SET, CREATE FUNCTION or ownership changes, are listed as skipped and don’t affect the tables.',
    },
    {
      question: 'Will the Mermaid output keep my table and column names?',
      answer:
        'Names that Mermaid accepts are kept as they are. Names with spaces, quotes or other characters Mermaid doesn’t allow are rewritten with underscores, and renamed columns keep their original name in the attribute comment.',
    },
  ],
};

export default docs;
