// Target side of "Send to…": on mount, takes text another tool sent here and puts it in the
// page's main input. Consumed once, so a reload shows the tool as usual.

import { useEffect, useRef } from 'react';
import { takeHandoff, type TextHandoff } from '../lib/handoff';

export function useIncomingText(toolId: string, setInput: (text: string, handoff: TextHandoff) => void) {
  const apply = useRef(setInput);
  useEffect(() => {
    apply.current = setInput;
  });
  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) apply.current(h.text, h);
  }, [toolId]);
}
