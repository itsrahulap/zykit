import { describe, expect, it } from 'vitest';
import { CHALLENGES, setupRepo } from '../../../src/tools/git-playground/features/challenges';
import { run, tokenize } from '../../../src/tools/git-playground/features/commands';
import { layoutGraph } from '../../../src/tools/git-playground/features/graph';
import { emptyRepo, headFiles, headId, type Repo } from '../../../src/tools/git-playground/features/repo';

/** Run lines in order; returns the repo and every output line. */
function play(lines: string[], start: Repo = emptyRepo()) {
  let repo = start;
  const out: { kind: string; text: string }[] = [];
  for (const line of lines) {
    const res = run(repo, line);
    repo = res.repo;
    out.push(...res.lines);
  }
  return { repo, out, errors: out.filter((l) => l.kind === 'err').map((l) => l.text) };
}

const base = ['git init', 'echo "one" > a.txt', 'git add .', 'git commit -m "First"'];

describe('tokenize', () => {
  it('groups quoted words and splits redirects', () => {
    expect(tokenize('git commit -m "Add login page"')).toEqual(['git', 'commit', '-m', 'Add login page']);
    expect(tokenize("echo 'a b'>>notes.txt")).toEqual(['echo', 'a b', '>>', 'notes.txt']);
  });
});

describe('git commands', () => {
  it('stages and commits, and status reports each stage', () => {
    const { repo, out } = play(['git init', 'echo "hi" > a.txt', 'git status']);
    expect(out.map((l) => l.text).join('\n')).toContain('Untracked files:\n        a.txt');
    const done = play(['git add a.txt', 'git commit -m "Add a"', 'git status'], repo);
    expect(done.errors).toEqual([]);
    expect(headFiles(done.repo)).toEqual({ 'a.txt': 'hi\n' });
    expect(done.out.at(-1)!.text).toContain('nothing to commit, working tree clean');
  });

  it('leaves the repo unchanged when a command fails', () => {
    const { repo } = play(base);
    const res = run(repo, 'git switch nope');
    expect(res.repo).toBe(repo);
    expect(res.lines[0].kind).toBe('err');
  });

  it('refuses git outside a repository and commits without a message', () => {
    expect(run(emptyRepo(), 'git status').lines[0].text).toContain('git init');
    expect(play([...base, 'echo "x" >> a.txt', 'git commit -a']).errors[0]).toContain('-m');
  });

  it('fast-forwards, and makes a merge commit when both sides moved', () => {
    const ff = play([...base, 'git switch -c f', 'echo b > b.txt', 'git add .', 'git commit -m "B"', 'git switch main', 'git merge f']);
    expect(ff.errors).toEqual([]);
    expect(headId(ff.repo)).toBe(ff.repo.branches.f);
    const three = play(['git switch main', 'echo c > c.txt', 'git add .', 'git commit -m "C"', 'git switch f', 'echo d > d.txt', 'git add .', 'git commit -m "D"', 'git switch main', 'git merge f'], ff.repo);
    expect(three.errors).toEqual([]);
    const merge = three.repo.commits[headId(three.repo)!];
    expect(merge.parents).toHaveLength(2);
    expect(Object.keys(merge.files).sort()).toEqual(['a.txt', 'b.txt', 'c.txt', 'd.txt']);
  });

  it('stops on conflicts with markers, and blocks the commit until they are fixed', () => {
    const { repo, errors } = play([...base, 'git switch -c f', 'echo "two" > a.txt', 'git commit -am "Two"', 'git switch main', 'echo "three" > a.txt', 'git commit -am "Three"', 'git merge f']);
    expect(errors.at(-1)).toContain('Automatic merge failed');
    expect(repo.working['a.txt']).toBe('<<<<<<< HEAD\nthree\n=======\ntwo\n>>>>>>> f\n');
    expect(play(['git add a.txt', 'git commit -m "M"'], repo).errors[0]).toContain('conflict markers');
    const fixed = play(['echo "both" > a.txt', 'git add a.txt', 'git commit -m "M"'], repo);
    expect(fixed.errors).toEqual([]);
    expect(fixed.repo.merging).toBeNull();
    expect(fixed.repo.commits[headId(fixed.repo)!].parents).toHaveLength(2);
  });

  it('resets soft, mixed and hard as git does', () => {
    const two = [...base, 'echo "two" >> a.txt', 'git commit -am "Second"'];
    const soft = play([...two, 'git reset --soft HEAD~1']).repo;
    expect(soft.commits[headId(soft)!].message).toBe('First');
    expect(soft.index['a.txt']).toBe('one\ntwo\n');
    const mixed = play([...two, 'git reset HEAD~1']).repo;
    expect([mixed.index['a.txt'], mixed.working['a.txt']]).toEqual(['one\n', 'one\ntwo\n']);
    const hard = play([...two, 'git reset --hard HEAD~1']).repo;
    expect(hard.working['a.txt']).toBe('one\n');
  });

  it('will not switch branches when that would overwrite local changes', () => {
    const { repo } = play([...base, 'git switch -c f', 'echo "f" > a.txt', 'git commit -am "F"', 'git switch main', 'echo "edit" > a.txt']);
    expect(run(repo, 'git switch f').lines[0].text).toContain('would be overwritten');
    // A change to a file the target doesn't touch is carried over instead.
    const carried = play(['git restore a.txt', 'echo "new" > b.txt', 'git switch f'], repo);
    expect(carried.errors).toEqual([]);
    expect(carried.repo.working['b.txt']).toBe('new\n');
  });

  it('rejects a push that would drop remote commits', () => {
    const { repo } = play([...base, 'git remote add origin https://example.com/x.git', 'git push -u origin main', 'git commit --amend -m "Rewritten"']);
    expect(run(repo, 'git push').lines[0].text).toContain('rejected');
    expect(run(repo, 'git push --force').lines[0].kind).toBe('out');
  });
});

describe('challenges', () => {
  it.each(CHALLENGES.map((c) => [c.id, c] as const))('%s: setup works, starts unsolved, and its solution solves it', (_id, challenge) => {
    const start = setupRepo(challenge);
    expect(challenge.check(start)).toBe(false);
    const { repo, errors } = play(challenge.solution, start);
    expect(errors.filter((e) => !e.includes('CONFLICT') && !e.includes('Automatic merge failed'))).toEqual([]);
    expect(challenge.check(repo)).toBe(true);
  });
});

describe('layoutGraph', () => {
  it('puts main on the top lane and a branch on its own lane', () => {
    const { repo } = play([...base, 'git switch -c f', 'echo b > b.txt', 'git add .', 'git commit -m "B"']);
    const g = layoutGraph(repo);
    expect(g.nodes.map((n) => [n.message, n.lane])).toEqual([
      ['First', 0],
      ['B', 1],
    ]);
    expect(g.edges).toHaveLength(1);
    expect(g.nodes[1].refs.map((r) => r.label)).toEqual(['HEAD -> f']);
  });
});
