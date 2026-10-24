// Pure logic for TypeScript Type Explorer: no DOM, so it's unit-testable in Node. The compiler module
// and the lib .d.ts texts are passed in, so the worker can lazy-load them and tests can read them from disk.

import type * as TS from 'typescript';

export type TsModule = typeof TS;

/** Longest program the explorer checks; bigger input is refused before it reaches the compiler. */
export const MAX_CODE_CHARS = 20_000;
/** Includes the first request, which downloads and parses the ~9 MB compiler. */
export const TIMEOUT_MS = 20_000;

/**
 * The lib files `lib: ["es2015"]` pulls in through its `/// <reference lib>` chain. es2015 is enough for
 * every utility type (Awaited, Promise, Map…) and keeps the worker chunk small compared to esnext.
 */
export const LIB_FILE_NAMES = [
  'lib.es5.d.ts',
  'lib.decorators.d.ts',
  'lib.decorators.legacy.d.ts',
  'lib.es2015.d.ts',
  'lib.es2015.core.d.ts',
  'lib.es2015.collection.d.ts',
  'lib.es2015.generator.d.ts',
  'lib.es2015.iterable.d.ts',
  'lib.es2015.promise.d.ts',
  'lib.es2015.proxy.d.ts',
  'lib.es2015.reflect.d.ts',
  'lib.es2015.symbol.d.ts',
  'lib.es2015.symbol.wellknown.d.ts',
] as const;

export type LibFiles = Record<string, string>;

export interface TypeDiagnostic {
  line: number;
  column: number;
  code: number;
  category: 'error' | 'warning' | 'suggestion' | 'message';
  message: string;
}

export interface ResolvedDeclaration {
  name: string;
  kind: 'type' | 'const' | 'let' | 'var' | 'function';
  line: number;
  /** Type as the compiler prints it, with type aliases expanded one level. */
  type: string;
}

export interface Analysis {
  diagnostics: TypeDiagnostic[];
  declarations: ResolvedDeclaration[];
}

const FILE_NAME = '/example.ts';

/**
 * Builds an analyzer over an in-memory compiler host. Lib files are parsed once and reused for every
 * call, so only the user's file is re-parsed and re-checked. User code is only type-checked, never emitted or run.
 */
export function createTypeAnalyzer(ts: TsModule, libFiles: LibFiles): (code: string) => Analysis {
  const options: TS.CompilerOptions = {
    lib: ['lib.es2015.d.ts'],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };
  const libSources = new Map<string, TS.SourceFile>();
  const libSource = (name: string) => {
    let source = libSources.get(name);
    if (!source && libFiles[name] !== undefined) {
      source = ts.createSourceFile(`/${name}`, libFiles[name], ts.ScriptTarget.ES2022);
      libSources.set(name, source);
    }
    return source;
  };

  return (code) => {
    if (code.length > MAX_CODE_CHARS) throw new RangeError(`Code is longer than ${MAX_CODE_CHARS.toLocaleString('en')} characters.`);
    const userSource = ts.createSourceFile(FILE_NAME, code, ts.ScriptTarget.ES2022, true);
    const host: TS.CompilerHost = {
      getSourceFile: (fileName) => (fileName === FILE_NAME ? userSource : libSource(fileName.replace(/^\//, ''))),
      getDefaultLibFileName: () => '/lib.d.ts',
      getDefaultLibLocation: () => '/',
      writeFile: () => {},
      getCurrentDirectory: () => '/',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      fileExists: (fileName) => fileName === FILE_NAME || libFiles[fileName.replace(/^\//, '')] !== undefined,
      readFile: (fileName) => (fileName === FILE_NAME ? code : libFiles[fileName.replace(/^\//, '')]),
    };
    const program = ts.createProgram([FILE_NAME], options, host);
    return {
      diagnostics: collectDiagnostics(ts, program, userSource),
      declarations: collectDeclarations(ts, program.getTypeChecker(), userSource),
    };
  };
}

const CATEGORY: Record<number, TypeDiagnostic['category']> = { 0: 'warning', 1: 'error', 2: 'suggestion', 3: 'message' };

/** Syntax, semantic and option diagnostics for the user's file, with 1-based line:column. */
export function collectDiagnostics(ts: TsModule, program: TS.Program, source: TS.SourceFile): TypeDiagnostic[] {
  const all = [...program.getOptionsDiagnostics(), ...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)];
  return all.map((diagnostic) => {
    const { line, character } =
      diagnostic.file === source && diagnostic.start !== undefined ? source.getLineAndCharacterOfPosition(diagnostic.start) : { line: 0, character: 0 };
    return {
      line: line + 1,
      column: character + 1,
      code: diagnostic.code,
      category: CATEGORY[diagnostic.category] ?? 'error',
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    };
  });
}

/** The resolved type of every top-level `type` alias, variable (simple names only) and function. */
export function collectDeclarations(ts: TsModule, checker: TS.TypeChecker, source: TS.SourceFile): ResolvedDeclaration[] {
  const flags = ts.TypeFormatFlags.NoTruncation;
  const lineOf = (node: TS.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const out: ResolvedDeclaration[] = [];
  for (const statement of source.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      // InTypeAlias prints the alias's structure instead of just its own name (`Pick<…>` → `{ a: 1; }`).
      const type = checker.getTypeAtLocation(statement.name);
      const isKeyof = ts.isTypeOperatorNode(statement.type) && statement.type.operator === ts.SyntaxKind.KeyOfKeyword;
      // The checker remembers that a union came from `keyof X` and prints it that way; list the keys instead.
      const printed =
        isKeyof && type.isUnion()
          ? type.types.map((member) => checker.typeToString(member, statement, flags)).join(' | ')
          : checker.typeToString(type, statement, flags | ts.TypeFormatFlags.InTypeAlias);
      out.push({ name: statement.name.text, kind: 'type', line: lineOf(statement), type: printed });
    } else if (ts.isVariableStatement(statement)) {
      const listFlags = statement.declarationList.flags;
      const kind = listFlags & ts.NodeFlags.Const ? 'const' : listFlags & ts.NodeFlags.Let ? 'let' : 'var';
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const type = checker.getTypeAtLocation(declaration.name);
        out.push({ name: declaration.name.text, kind, line: lineOf(declaration), type: checker.typeToString(type, declaration, flags) });
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      const type = checker.getTypeAtLocation(statement.name);
      out.push({ name: statement.name.text, kind: 'function', line: lineOf(statement), type: checker.typeToString(type, statement, flags) });
    }
  }
  return out;
}
