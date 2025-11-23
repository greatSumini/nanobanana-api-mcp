import { describe, it, expect } from '@jest/globals';
import { formatSubTree } from '../../../src/services/enhanced-tree-formatter.js';
import type { GitHubTreeResponse } from '../../../src/types/index.js';

describe('formatSubTree', () => {
  it('should format empty tree', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [],
      truncated: false,
    };

    const result = formatSubTree(input, '');
    expect(result).toBe('(empty directory)');
  });

  it('should format tree with basic statistics', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'file1.ts',
          mode: '100644',
          type: 'blob',
          sha: 'def456',
          size: 1024,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
        },
        {
          path: 'file2.ts',
          mode: '100644',
          type: 'blob',
          sha: 'ghi789',
          size: 2048,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ghi789',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '');
    expect(result).toContain('file1.ts');
    expect(result).toContain('file2.ts');
    expect(result).toContain('📊 Summary');
    expect(result).toContain('0 directories');
    expect(result).toContain('2 files');
    expect(result).toContain('3.0KB total');
  });

  it('should show file sizes when showSize is true', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'file1.ts',
          mode: '100644',
          type: 'blob',
          sha: 'def456',
          size: 1024,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
        },
        {
          path: 'file2.ts',
          mode: '100644',
          type: 'blob',
          sha: 'ghi789',
          size: 2048,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ghi789',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { showSize: true });
    expect(result).toContain('file1.ts (1.0KB)');
    expect(result).toContain('file2.ts (2.0KB)');
  });

  it('should show directory sizes when showSize is true', () => {
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
          size: 1024,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/bbb222',
        },
        {
          path: 'src/utils.ts',
          mode: '100644',
          type: 'blob',
          sha: 'ccc333',
          size: 2048,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/ccc333',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { showSize: true });
    expect(result).toContain('src/ (2 files, 3.0KB)');
    expect(result).toContain('index.ts (1.0KB)');
    expect(result).toContain('utils.ts (2.0KB)');
  });

  it('should limit depth when maxDepth is specified', () => {
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
          path: 'src/utils.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a4',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a4',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { maxDepth: 1 });
    expect(result).toContain('src/');
    expect(result).not.toContain('components/');
    expect(result).not.toContain('Button.tsx');
    expect(result).not.toContain('utils.ts');
    expect(result).toContain('(depth limited to 1)');
  });

  it('should filter files by extension', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'file1.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a1',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a1',
        },
        {
          path: 'file2.js',
          mode: '100644',
          type: 'blob',
          sha: 'a2',
          size: 200,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a2',
        },
        {
          path: 'file3.md',
          mode: '100644',
          type: 'blob',
          sha: 'a3',
          size: 300,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a3',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { fileExtFilter: ['.ts', '.js'] });
    expect(result).toContain('file1.ts');
    expect(result).toContain('file2.js');
    expect(result).not.toContain('file3.md');
    expect(result).toContain('(filtered: .ts, .js)');
  });

  it('should hide statistics when showStats is false', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'file1.ts',
          mode: '100644',
          type: 'blob',
          sha: 'a1',
          size: 100,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a1',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { showStats: false });
    expect(result).toContain('file1.ts');
    expect(result).not.toContain('📊 Summary');
  });

  it('should handle nested directories with all options', () => {
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
          size: 8192,
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
          size: 2048,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a5',
        },
        {
          path: 'README.md',
          mode: '100644',
          type: 'blob',
          sha: 'a6',
          size: 1024,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a6',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', {
      showSize: true,
      maxDepth: 2,
      showStats: true,
    });

    expect(result).toContain('src/');
    expect(result).toContain('components/');
    expect(result).toContain('utils/');
    expect(result).toContain('README.md (1.0KB)');
    expect(result).toContain('📊 Summary');
    expect(result).toContain('(depth limited to 2)');
  });

  it('should filter by directory path', () => {
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

    const result = formatSubTree(input, 'src');
    expect(result).toContain('index.ts');
    expect(result).not.toContain('tests');
    expect(result).not.toContain('test.ts');
  });

  it('should handle zero byte files', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'empty.txt',
          mode: '100644',
          type: 'blob',
          sha: 'a1',
          size: 0,
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a1',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { showSize: true });
    expect(result).toContain('empty.txt (0B)');
  });

  it('should format large file sizes correctly', () => {
    const input: GitHubTreeResponse = {
      sha: 'abc123',
      url: 'https://api.github.com/repos/owner/repo/git/trees/main',
      tree: [
        {
          path: 'large.bin',
          mode: '100644',
          type: 'blob',
          sha: 'a1',
          size: 5242880, // 5 MB
          url: 'https://api.github.com/repos/owner/repo/git/blobs/a1',
        },
      ],
      truncated: false,
    };

    const result = formatSubTree(input, '', { showSize: true });
    expect(result).toContain('large.bin (5.0MB)');
  });
});
