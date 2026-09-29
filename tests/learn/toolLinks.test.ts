import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/learn/data/catalog.generated';
import { TOPIC_TOOLS, toolIdsForTopic, topicsForTool } from '../../src/learn/data/toolLinks';
import { TOOLS } from '../../src/tools/registry';

const toolIds = new Set(TOOLS.map((t) => t.id));
const topicKeys = new Set(catalog.subjects.flatMap((s) => s.topics.map((t) => `${s.id}/${t.id}`)));

describe('Learn ↔ tool links', () => {
  it('every topic key and tool id resolves', () => {
    for (const [key, tools] of Object.entries(TOPIC_TOOLS)) {
      expect(topicKeys.has(key), `${key} is not a Learn topic`).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      for (const id of tools) expect(toolIds.has(id), `${key} → ${id} is not a tool`).toBe(true);
    }
  });

  it('looks up both directions', () => {
    expect(toolIdsForTopic('databases', 'joins')).toContain('sql-formatter');
    expect(toolIdsForTopic('javascript', 'no-such-topic')).toEqual([]);
    expect(topicsForTool('sql-formatter')).toContainEqual({ subjectId: 'databases', topicId: 'joins' });
    expect(topicsForTool('web-fundamentals')).toEqual([]);
  });
});
