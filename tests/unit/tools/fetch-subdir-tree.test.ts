import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createFetchSubdirTreeTool } from '../../../src/tools/fetch-subdir-tree.js';
import type { RepoIdentifier, GitHubTreeResponse } from '../../../src/types/index.js';
import { GitHubFetcher } from '../../../src/services/github-fetcher.js';

jest.mock('../../../src/services/github-fetcher.js');

describe('createFetchSubdirTreeTool', () => {
  let mockFetcher: jest.Mocked<GitHubFetcher>;

  beforeEach(() => {
    mockFetcher = {
      fetchFileContent: jest.fn(),
      fetchDirectoryTree: jest.fn(),
    } as unknown as jest.Mocked<GitHubFetcher>;
  });

  describe('with repoIdentifier', () => {
    it('should create tool with correct schema', () => {
      const repoIdentifier: RepoIdentifier = {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      };

      const tool = createFetchSubdirTreeTool(mockFetcher, repoIdentifier);

      expect(tool.name).toBe('fetch-subdir-tree');
      expect(tool.description).toContain('Fetches directory tree from GitHub repository');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
      expect(tool.inputSchema.shape).not.toHaveProperty('ownerName');
    });

    it('should fetch directory tree with dirPath only', async () => {
      const repoIdentifier: RepoIdentifier = {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      };

      const tool = createFetchSubdirTreeTool(mockFetcher, repoIdentifier);
      const mockTreeResponse: GitHubTreeResponse = {
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
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'a2',
            size: 100,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/a2',
          },
        ],
        truncated: false,
      };

      mockFetcher.fetchDirectoryTree.mockResolvedValue(mockTreeResponse);

      const result = await tool.handler({ dirPath: 'src' });

      expect(mockFetcher.fetchDirectoryTree).toHaveBeenCalledWith(
        'facebook',
        'react',
        'main',
        'src'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('index.ts');
    });

    it('should handle empty directory path', async () => {
      const repoIdentifier: RepoIdentifier = {
        owner: 'owner',
        repo: 'repo',
        branch: 'branch',
      };

      const tool = createFetchSubdirTreeTool(mockFetcher, repoIdentifier);
      const mockTreeResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/branch',
        tree: [],
        truncated: false,
      };

      mockFetcher.fetchDirectoryTree.mockResolvedValue(mockTreeResponse);

      const result = await tool.handler({ dirPath: '' });

      expect(mockFetcher.fetchDirectoryTree).toHaveBeenCalledWith(
        'owner',
        'repo',
        'branch',
        ''
      );
      expect(result.content[0].text).toBe('(empty directory)');
    });
  });

  describe('without repoIdentifier', () => {
    it('should create tool with correct schema', () => {
      const tool = createFetchSubdirTreeTool(mockFetcher);

      expect(tool.name).toBe('fetch-subdir-tree');
      expect(tool.inputSchema.shape).toHaveProperty('ownerName');
      expect(tool.inputSchema.shape).toHaveProperty('repoName');
      expect(tool.inputSchema.shape).toHaveProperty('branchName');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
    });

    it('should fetch directory tree with all parameters', async () => {
      const tool = createFetchSubdirTreeTool(mockFetcher);
      const mockTreeResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/microsoft/vscode/git/trees/main',
        tree: [
          {
            path: 'tests/test.ts',
            mode: '100644',
            type: 'blob',
            sha: 'a1',
            size: 100,
            url: 'https://api.github.com/repos/microsoft/vscode/git/blobs/a1',
          },
        ],
        truncated: false,
      };

      mockFetcher.fetchDirectoryTree.mockResolvedValue(mockTreeResponse);

      const result = await tool.handler({
        ownerName: 'microsoft',
        repoName: 'vscode',
        branchName: 'develop',
        dirPath: 'tests',
      } as any);

      expect(mockFetcher.fetchDirectoryTree).toHaveBeenCalledWith(
        'microsoft',
        'vscode',
        'develop',
        'tests'
      );
      expect(result.content[0].text).toContain('test.ts');
    });

    it('should use default branch when not provided', async () => {
      const tool = createFetchSubdirTreeTool(mockFetcher);
      const mockTreeResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/main',
        tree: [],
        truncated: false,
      };

      mockFetcher.fetchDirectoryTree.mockResolvedValue(mockTreeResponse);

      const result = await tool.handler({
        ownerName: 'owner',
        repoName: 'repo',
        dirPath: '',
      } as any);

      expect(mockFetcher.fetchDirectoryTree).toHaveBeenCalledWith(
        'owner',
        'repo',
        'main',
        ''
      );
      expect(result.content[0].text).toBe('(empty directory)');
    });
  });
});
