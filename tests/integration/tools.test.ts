import { describe, it, expect } from '@jest/globals';
import { GitHubFetcher } from '../../src/services/github-fetcher.js';
import { createFetchFileTool } from '../../src/tools/fetch-file.js';
import { createFetchSubdirTreeTool } from '../../src/tools/fetch-subdir-tree.js';
import { createFetchSubTreeTool } from '../../src/tools/fetch-sub-tree.js';
import type { RepoIdentifier } from '../../src/types/index.js';

describe('Integration Tests - Tools', () => {
  describe('Tool creation and structure', () => {
    it('should create fetch-file tool with repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const repoIdentifier: RepoIdentifier = {
        owner: 'test',
        repo: 'repo',
        branch: 'main',
      };

      const tool = createFetchFileTool(fetcher, repoIdentifier);

      expect(tool.name).toBe('fetch-file');
      expect(tool.description).toContain('test/repo/main');
      expect(tool.inputSchema.shape).toHaveProperty('filePath');
      expect(typeof tool.handler).toBe('function');
    });

    it('should create fetch-file tool without repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const tool = createFetchFileTool(fetcher);

      expect(tool.name).toBe('fetch-file');
      expect(tool.inputSchema.shape).toHaveProperty('ownerName');
      expect(tool.inputSchema.shape).toHaveProperty('repoName');
      expect(tool.inputSchema.shape).toHaveProperty('branchName');
      expect(tool.inputSchema.shape).toHaveProperty('filePath');
      expect(typeof tool.handler).toBe('function');
    });

    it('should create fetch-subdir-tree tool with repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const repoIdentifier: RepoIdentifier = {
        owner: 'test',
        repo: 'repo',
        branch: 'main',
      };

      const tool = createFetchSubdirTreeTool(fetcher, repoIdentifier);

      expect(tool.name).toBe('fetch-subdir-tree');
      expect(tool.description).toContain('test/repo/main');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
      expect(typeof tool.handler).toBe('function');
    });

    it('should create fetch-subdir-tree tool without repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const tool = createFetchSubdirTreeTool(fetcher);

      expect(tool.name).toBe('fetch-subdir-tree');
      expect(tool.inputSchema.shape).toHaveProperty('ownerName');
      expect(tool.inputSchema.shape).toHaveProperty('repoName');
      expect(tool.inputSchema.shape).toHaveProperty('branchName');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
      expect(typeof tool.handler).toBe('function');
    });

    it('should create fetch-sub-tree tool with repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const repoIdentifier: RepoIdentifier = {
        owner: 'test',
        repo: 'repo',
        branch: 'main',
      };

      const tool = createFetchSubTreeTool(fetcher, repoIdentifier);

      expect(tool.name).toBe('fetch-sub-tree');
      expect(tool.description).toContain('test/repo/main');
      expect(tool.description).toContain('enhanced');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
      expect(tool.inputSchema.shape).toHaveProperty('showSize');
      expect(tool.inputSchema.shape).toHaveProperty('maxDepth');
      expect(tool.inputSchema.shape).toHaveProperty('showStats');
      expect(tool.inputSchema.shape).toHaveProperty('fileExtFilter');
      expect(typeof tool.handler).toBe('function');
    });

    it('should create fetch-sub-tree tool without repoIdentifier', () => {
      const fetcher = new GitHubFetcher();
      const tool = createFetchSubTreeTool(fetcher);

      expect(tool.name).toBe('fetch-sub-tree');
      expect(tool.description).toContain('enhanced');
      expect(tool.inputSchema.shape).toHaveProperty('ownerName');
      expect(tool.inputSchema.shape).toHaveProperty('repoName');
      expect(tool.inputSchema.shape).toHaveProperty('branchName');
      expect(tool.inputSchema.shape).toHaveProperty('dirPath');
      expect(tool.inputSchema.shape).toHaveProperty('showSize');
      expect(tool.inputSchema.shape).toHaveProperty('maxDepth');
      expect(tool.inputSchema.shape).toHaveProperty('showStats');
      expect(tool.inputSchema.shape).toHaveProperty('fileExtFilter');
      expect(typeof tool.handler).toBe('function');
    });
  });
});
