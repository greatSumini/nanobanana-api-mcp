import { z } from 'zod';
import type { RepoIdentifier } from '../types/index.js';
import type { GitHubFetcher } from '../services/github-fetcher.js';
import { formatTree } from '../services/tree-formatter.js';

/**
 * Creates the fetch-subdir-tree tool
 * @param fetcher - GitHub fetcher service
 * @param repoIdentifier - Optional repository identifier from CLI args
 */
export function createFetchSubdirTreeTool(
  fetcher: GitHubFetcher,
  repoIdentifier?: RepoIdentifier
) {
  // Define schema based on whether repoIdentifier is provided
  const inputSchema = repoIdentifier
    ? z.object({
        dirPath: z.string().describe('Path to the directory in the repository (empty for root)'),
      })
    : z.object({
        ownerName: z.string().describe('Repository owner name'),
        repoName: z.string().describe('Repository name'),
        branchName: z.string().optional().default('main').describe('Branch name (default: main)'),
        dirPath: z.string().describe('Path to the directory in the repository (empty for root)'),
      });

  type InputType = z.infer<typeof inputSchema>;

  return {
    name: 'fetch-subdir-tree',
    description: repoIdentifier
      ? `Fetches directory tree from GitHub repository ${repoIdentifier.owner}/${repoIdentifier.repo}/${repoIdentifier.branch}`
      : 'Fetches directory tree from a GitHub repository',
    inputSchema,
    async handler(input: InputType) {
      const owner = repoIdentifier?.owner ?? (input as unknown as { ownerName: string }).ownerName;
      const repo = repoIdentifier?.repo ?? (input as unknown as { repoName: string }).repoName;
      const branch = repoIdentifier?.branch ?? ((input as unknown as { branchName?: string }).branchName || 'main');
      const dirPath = input.dirPath;

      const treeResponse = await fetcher.fetchDirectoryTree(owner, repo, branch, dirPath);
      const formattedTree = formatTree(treeResponse, dirPath);

      return {
        content: [
          {
            type: 'text' as const,
            text: formattedTree,
          },
        ],
      };
    },
  };
}
