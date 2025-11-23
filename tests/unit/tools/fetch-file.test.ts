import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createFetchFileTool } from '../../../src/tools/fetch-file.js';
import type { RepoIdentifier } from '../../../src/types/index.js';
import { GitHubFetcher } from '../../../src/services/github-fetcher.js';

jest.mock('../../../src/services/github-fetcher.js');

describe('createFetchFileTool', () => {
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

      const tool = createFetchFileTool(mockFetcher, repoIdentifier);

      expect(tool.name).toBe('fetch-file');
      expect(tool.description).toContain('Fetches file content from GitHub repository');
      expect(tool.inputSchema.shape).toHaveProperty('filePath');
      expect(tool.inputSchema.shape).not.toHaveProperty('ownerName');
    });

    it('should fetch file with filePath only', async () => {
      const repoIdentifier: RepoIdentifier = {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      };

      const tool = createFetchFileTool(mockFetcher, repoIdentifier);
      const mockContent = 'export const foo = "bar";';

      mockFetcher.fetchFileContent.mockResolvedValue(mockContent);

      const result = await tool.handler({ filePath: 'src/index.ts' });

      expect(mockFetcher.fetchFileContent).toHaveBeenCalledWith(
        'facebook',
        'react',
        'main',
        'src/index.ts'
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(mockContent);
    });

    it('should handle errors gracefully', async () => {
      const repoIdentifier: RepoIdentifier = {
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
      };

      const tool = createFetchFileTool(mockFetcher, repoIdentifier);

      mockFetcher.fetchFileContent.mockRejectedValue(
        new Error('Failed to fetch file: 404 Not Found')
      );

      await expect(tool.handler({ filePath: 'missing.ts' })).rejects.toThrow(
        'Failed to fetch file: 404 Not Found'
      );
    });
  });

  describe('without repoIdentifier', () => {
    it('should create tool with correct schema', () => {
      const tool = createFetchFileTool(mockFetcher);

      expect(tool.name).toBe('fetch-file');
      expect(tool.inputSchema.shape).toHaveProperty('ownerName');
      expect(tool.inputSchema.shape).toHaveProperty('repoName');
      expect(tool.inputSchema.shape).toHaveProperty('branchName');
      expect(tool.inputSchema.shape).toHaveProperty('filePath');
    });

    it('should fetch file with all parameters', async () => {
      const tool = createFetchFileTool(mockFetcher);
      const mockContent = 'console.log("Hello");';

      mockFetcher.fetchFileContent.mockResolvedValue(mockContent);

      const result = await tool.handler({
        ownerName: 'microsoft',
        repoName: 'vscode',
        branchName: 'main',
        filePath: 'src/main.ts',
      } as any);

      expect(mockFetcher.fetchFileContent).toHaveBeenCalledWith(
        'microsoft',
        'vscode',
        'main',
        'src/main.ts'
      );
      expect(result.content[0].text).toBe(mockContent);
    });

    it('should use default branch when not provided', async () => {
      const tool = createFetchFileTool(mockFetcher);
      const mockContent = 'content';

      mockFetcher.fetchFileContent.mockResolvedValue(mockContent);

      const result = await tool.handler({
        ownerName: 'owner',
        repoName: 'repo',
        filePath: 'file.ts',
      } as any);

      expect(mockFetcher.fetchFileContent).toHaveBeenCalledWith(
        'owner',
        'repo',
        'main',
        'file.ts'
      );
      expect(result.content[0].text).toBe(mockContent);
    });
  });
});
