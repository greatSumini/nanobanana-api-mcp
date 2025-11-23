import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createFetchSubTreeTool } from '../../../src/tools/fetch-sub-tree.js';
import { GitHubFetcher } from '../../../src/services/github-fetcher.js';
import type { GitHubTreeResponse } from '../../../src/types/index.js';

describe('createFetchSubTreeTool', () => {
  let mockFetcher: GitHubFetcher;
  let mockFetchDirectoryTree: jest.Mock<
    (owner: string, repo: string, branch: string, dirPath: string) => Promise<GitHubTreeResponse>
  >;

  beforeEach(() => {
    mockFetchDirectoryTree = jest.fn<
      (owner: string, repo: string, branch: string, dirPath: string) => Promise<GitHubTreeResponse>
    >();
    mockFetcher = {
      fetchDirectoryTree: mockFetchDirectoryTree,
    } as any;
  });

  describe('with repoIdentifier', () => {
    it('should create tool with correct name and description', () => {
      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      expect(tool.name).toBe('fetch-sub-tree');
      expect(tool.description).toContain('facebook/react/main');
      expect(tool.description).toContain('enhanced');
      expect(tool.description).toContain('file sizes');
      expect(tool.description).toContain('depth limits');
    });

    it('should fetch directory tree with basic options', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1024,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/def456',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      const result = await tool.handler({ dirPath: 'src' });

      expect(mockFetchDirectoryTree).toHaveBeenCalledWith('facebook', 'react', 'main', 'src');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('index.ts');
    });

    it('should fetch directory tree with showSize option', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1024,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/def456',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      const result = await tool.handler({ dirPath: 'src', showSize: true });

      expect(result.content[0].text).toContain('1.0KB');
    });

    it('should fetch directory tree with maxDepth option', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'src',
            mode: '040000',
            type: 'tree',
            sha: 'a1',
            url: 'https://api.github.com/repos/facebook/react/git/trees/a1',
          },
          {
            path: 'src/components',
            mode: '040000',
            type: 'tree',
            sha: 'a2',
            url: 'https://api.github.com/repos/facebook/react/git/trees/a2',
          },
          {
            path: 'src/components/Button.tsx',
            mode: '100644',
            type: 'blob',
            sha: 'a3',
            size: 100,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a3',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      const result = await tool.handler({ dirPath: '', maxDepth: 1 });

      expect(result.content[0].text).toContain('src/');
      expect(result.content[0].text).not.toContain('components/');
      expect(result.content[0].text).toContain('(depth limited to 1)');
    });

    it('should fetch directory tree with fileExtFilter option', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'file1.ts',
            mode: '100644',
            type: 'blob',
            sha: 'a1',
            size: 100,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a1',
          },
          {
            path: 'file2.js',
            mode: '100644',
            type: 'blob',
            sha: 'a2',
            size: 200,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a2',
          },
          {
            path: 'file3.md',
            mode: '100644',
            type: 'blob',
            sha: 'a3',
            size: 300,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a3',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      const result = await tool.handler({ dirPath: '', fileExtFilter: ['.ts', '.js'] });

      expect(result.content[0].text).toContain('file1.ts');
      expect(result.content[0].text).toContain('file2.js');
      expect(result.content[0].text).not.toContain('file3.md');
      expect(result.content[0].text).toContain('(filtered: .ts, .js)');
    });

    it('should hide statistics when showStats is false', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'file1.ts',
            mode: '100644',
            type: 'blob',
            sha: 'a1',
            size: 100,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a1',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher, {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      });

      const result = await tool.handler({ dirPath: '', showStats: false });

      expect(result.content[0].text).not.toContain('📊 Summary');
    });
  });

  describe('without repoIdentifier', () => {
    it('should create tool with generic description', () => {
      const tool = createFetchSubTreeTool(mockFetcher);

      expect(tool.name).toBe('fetch-sub-tree');
      expect(tool.description).toContain('enhanced');
      expect(tool.description).not.toContain('facebook/react');
    });

    it('should fetch directory tree with all parameters', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/microsoft/vscode/git/trees/main',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1024,
            url: 'https://api.github.com/repos/microsoft/vscode/git/blobs/def456',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher);

      const result = await tool.handler({
        ownerName: 'microsoft',
        repoName: 'vscode',
        branchName: 'main',
        dirPath: 'src',
      } as any);

      expect(mockFetchDirectoryTree).toHaveBeenCalledWith('microsoft', 'vscode', 'main', 'src');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('index.ts');
    });

    it('should use default branch when not specified', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/microsoft/vscode/git/trees/main',
        tree: [],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher);

      await tool.handler({
        ownerName: 'microsoft',
        repoName: 'vscode',
        dirPath: 'src',
      } as any);

      expect(mockFetchDirectoryTree).toHaveBeenCalledWith('microsoft', 'vscode', 'main', 'src');
    });

    it('should fetch directory tree with all options', async () => {
      const mockResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/microsoft/vscode/git/trees/main',
        tree: [
          {
            path: 'file1.ts',
            mode: '100644',
            type: 'blob',
            sha: 'a1',
            size: 1024,
            url: 'https://api.github.com/repos/microsoft/vscode/git/blobs/a1',
          },
        ],
        truncated: false,
      };

      mockFetchDirectoryTree.mockResolvedValue(mockResponse);

      const tool = createFetchSubTreeTool(mockFetcher);

      const result = await tool.handler({
        ownerName: 'microsoft',
        repoName: 'vscode',
        dirPath: '',
        showSize: true,
        maxDepth: 2,
        showStats: true,
        fileExtFilter: ['.ts'],
      } as any);

      expect(result.content[0].text).toContain('file1.ts (1.0KB)');
      expect(result.content[0].text).toContain('📊 Summary');
    });
  });
});
