import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GitHubFetcher } from '../../../src/services/github-fetcher.js';
import type { GitHubTreeResponse } from '../../../src/types/index.js';

describe('GitHubFetcher', () => {
  let fetcher: GitHubFetcher;
  let mockFetch: jest.Mock<typeof fetch>;

  beforeEach(() => {
    fetcher = new GitHubFetcher();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('fetchFileContent', () => {
    it('should construct correct URL and fetch file content', async () => {
      const mockContent = 'console.log("Hello World");';
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockContent,
      } as Response);

      const result = await fetcher.fetchFileContent(
        'facebook',
        'react',
        'main',
        'src/index.ts'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/facebook/react/main/src/index.ts'
      );
      expect(result).toBe(mockContent);
    });

    it('should handle paths with leading slash', async () => {
      const mockContent = 'content';
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockContent,
      } as Response);

      await fetcher.fetchFileContent('owner', 'repo', 'branch', '/path/file.ts');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/owner/repo/branch/path/file.ts'
      );
    });

    it('should throw error when file not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(
        fetcher.fetchFileContent('owner', 'repo', 'branch', 'missing.ts')
      ).rejects.toThrow('Failed to fetch file: 404 Not Found');
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        fetcher.fetchFileContent('owner', 'repo', 'branch', 'file.ts')
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchDirectoryTree', () => {
    it('should construct correct API URL and fetch tree', async () => {
      const mockTreeResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/facebook/react/git/trees/main',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1234,
            url: 'https://api.github.com/repos/facebook/react/git/blobs/def456',
          },
          {
            path: 'src/utils',
            mode: '040000',
            type: 'tree',
            sha: 'ghi789',
            url: 'https://api.github.com/repos/facebook/react/git/trees/ghi789',
          },
        ],
        truncated: false,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTreeResponse,
      } as Response);

      const result = await fetcher.fetchDirectoryTree(
        'facebook',
        'react',
        'main',
        'src'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/facebook/react/git/trees/main?recursive=1'
      );
      expect(result).toEqual(mockTreeResponse);
    });

    it('should handle empty directory path', async () => {
      const mockTreeResponse: GitHubTreeResponse = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/branch',
        tree: [],
        truncated: false,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTreeResponse,
      } as Response);

      await fetcher.fetchDirectoryTree('owner', 'repo', 'branch', '');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/branch?recursive=1'
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      await expect(
        fetcher.fetchDirectoryTree('owner', 'repo', 'branch', 'src')
      ).rejects.toThrow('Failed to fetch directory tree: 403 Forbidden');
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        fetcher.fetchDirectoryTree('owner', 'repo', 'branch', 'src')
      ).rejects.toThrow('Network error');
    });
  });
});
