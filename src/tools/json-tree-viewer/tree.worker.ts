// Parses big JSON off the main thread and posts the raw-text tree back.
import { parseJson } from '../json-formatter/features/json';

self.onmessage = (e: MessageEvent<string>) => {
  self.postMessage(parseJson(e.data));
};
