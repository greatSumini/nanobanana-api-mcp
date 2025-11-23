import { describe, it, expect } from '@jest/globals';
import { formatTree } from '../../../src/services/tree-formatter.js';
import type { GitHubTreeResponse } from '../../../src/types/index.js';

describe('formatTree', () => {
  it('should format empty tree', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [],
      truncated: false,
    };

    const result = formatTree(input, '');
    expect(result).toBe('(empty directory)');
  });

  it('should format tree with files only', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'file1.ts',
          mode: '100644',
          type: 'blob',
          sha: 'def456',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
        },
        {
          path: 'file2.ts',
          mode: '100644',
          type: 'blob',
          sha: 'ghi789',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ghi789',
        },
      ],
      truncated: false,
    };

    const result = formatTree(input, '');
    expect(result).toBe('file1.ts\nfile2.ts');
  });

  it('should format tree with directories', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'src',
          mode: '040000',
          type: 'tree',
          sha: 'aaa111',
          url: 'https://api.github.com/repos/owner/repo/git/trees/aaa111',
        },
        {
          path: 'src/index.ts',
          mode: '100644',
          type: 'blob',
          sha: 'bbb222',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/bbb222',
        },
        {
          path: 'src/utils.ts',
          mode: '100644',
          type: 'blob',
          sha: 'ccc333',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ccc333',
        },
        {
          path: 'README.md',
          mode: '100644',
          type: 'blob',
          sha: 'ddd444',
          size: 50,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ddd444',
        },
      ],
      truncated: false,
    };

    const result = formatTree(input, '');
    const expected = `README.md
src/
├── index.ts
└── utils.ts`;
    expect(result).toBe(expected);
  });

  it('should format nested directories', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'src',
          mode: '040000',
          type: 'tree',
          sha: 'a1',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a1',
        },
        {
          path: 'src/components',
          mode: '040000',
          type: 'tree',
          sha: 'a2',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a2',
        },
        {
          path: 'src/components/Button.tsx',
          mode: '100644',
          type: 'blob',
          sha: 'a3',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a3',
        },
        {
          path: 'src/utils',
          mode: '040000',
          type: 'tree',
          sha: 'a4',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a4',
        },
        {
          path: 'src/utils/helpers.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a5',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a5',
        },
      ],
      truncated: false,
    };

    const result = formatTree(input, '');
    const expected = `src/
├── components/
│   └── Button.tsx
└── utils/
    └── helpers.ts`;
    expect(result).toBe(expected);
  });

  it('should filter tree by directory path', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'src',
          mode: '040000',
          type: 'tree',
          sha: 'a1',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a1',
        },
        {
          path: 'src/index.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a2',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a2',
        },
        {
          path: 'tests',
          mode: '040000',
          type: 'tree',
          sha: 'a3',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a3',
        },
        {
          path: 'tests/test.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a4',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a4',
        },
      ],
      truncated: false,
    };

    const result = formatTree(input, 'src');
    expect(result).toBe('index.ts');
  });

  it('should handle multiple files in same directory with proper tree symbols', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'src',
          mode: '040000',
          type: 'tree',
          sha: 'a1',
          url: 'https://api.github.com/repos/owner/repo/git/trees/a1',
        },
        {
          path: 'src/a.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a2',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a2',
        },
        {
          path: 'src/b.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a3',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a3',
        },
        {
          path: 'src/c.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a4',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a4',
        },
      ],
      truncated: false,
    };

    const result = formatTree(input, '');
    const expected = `src/
├── a.ts
├── b.ts
└── c.ts`;
    expect(result).toBe(expected);
  });
});
