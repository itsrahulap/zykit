export type HashRequest = { files: { id: number; file: File }[] };

export type HashResponse =
  | { type: 'hash'; id: number; hash: string; bytes: number }
  | { type: 'fail'; id: number; message: string; bytes: number }
  | { type: 'done' };
