import type { LayoutOptions, Metadata, Rotation } from '../features/images-to-pdf';

export interface WireItem {
  bytes: ArrayBuffer;
  kind: 'jpeg' | 'png';
  rotation: Rotation;
}

export type BuildRequest = { id: number; type: 'build'; items: WireItem[]; layout: LayoutOptions; meta: Metadata };

export type BuildResponse =
  | { id: number; type: 'progress'; done: number; total: number }
  | { id: number; type: 'built'; bytes: Uint8Array }
  | { id: number; type: 'error'; message: string };
