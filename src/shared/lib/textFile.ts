// Reading a user's text file into a tool's input: size-capped, and binary files are refused
// with a friendly message instead of filling the editor with garbage.

import { formatBytes } from '../utils/format.utils';

/** Default cap for text files opened or dropped into a tool. */
export const MAX_TEXT_FILE_BYTES = 10 * 1024 * 1024;

export class TextFileError extends Error {}

export async function readTextFile(file: File, maxBytes = MAX_TEXT_FILE_BYTES): Promise<string> {
  if (file.size > maxBytes) {
    throw new TextFileError(`${file.name} is ${formatBytes(file.size)}; files up to ${formatBytes(maxBytes)} can be opened here.`);
  }
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  } catch {
    throw new TextFileError(`Couldn't read ${file.name}.`);
  }
  if (head.includes(0)) throw new TextFileError(`${file.name} doesn't look like a text file.`);
  try {
    return await file.text();
  } catch {
    throw new TextFileError(`Couldn't read ${file.name}.`);
  }
}
