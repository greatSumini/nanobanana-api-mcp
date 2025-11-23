import { z } from 'zod';
import type { RepoIdentifier } from '../types/index.js';
import type { GitHubFetcher } from '../services/github-fetcher.js';
import { formatSubTree } from '../services/enhanced-tree-formatter.js';

/**
 * Creates the fetch-sub-tree tool (enhanced version with options)
 * @param fetcher - GitHub fetcher service
 * @param repoIdentifier - Optional repository identifier from CLI args
 */
export function createFetchSubTreeTool(
  fetcher: GitHubFetcher,
  repoIdentifier?: RepoIdentifier
) {
  // Define schema based on whether repoIdentifier is provided
  const inputSchema = repoIdentifier
    ? z.object({
        dirPath: z
          .string()
          .describe('Path to the directory in the repository (empty for root)'),
        showSize: z
          .boolean()
          .optional()
          .describe('Show file and directory sizes (default: false)'),
        maxDepth: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum depth to traverse (default: unlimited)'),
        showStats: z
          .boolean()
          .optional()
          .describe('Show statistics summary (default: true)'),
        fileExtFilter: z
          .array(z.string())
          .optional()
          .describe('Filter files by extensions (e.g., [".ts", ".js"])'),
      })
    : z.object({
        ownerName: z.string().describe('Repository owner name'),
        repoName: z.string().describe('Repository name'),
        branchName: z
          .string()
          .optional()
          .default('main')
          .describe('Branch name (default: main)'),
        dirPath: z
          .string()
          .describe('Path to the directory in the repository (empty for root)'),
        showSize: z
          .boolean()
          .optional()
          .describe('Show file and directory sizes (default: false)'),
        maxDepth: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum depth to traverse (default: unlimited)'),
        showStats: z
          .boolean()
          .optional()
          .describe('Show statistics summary (default: true)'),
        fileExtFilter: z
          .array(z.string())
          .optional()
          .describe('Filter files by extensions (e.g., [".ts", ".js"])'),
      });

  type InputType = z.infer<typeof inputSchema>;

  return {
    name: 'fetch-sub-tree',
    description: repoIdentifier
      ? `Fetches enhanced directory tree with options from GitHub repository ${repoIdentifier.owner}/${repoIdentifier.repo}/${repoIdentifier.branch}. Supports file sizes, depth limits, statistics, and extension filtering.`
      : 'Fetches enhanced directory tree with options from a GitHub repository. Supports file sizes, depth limits, statistics, and extension filtering.',
    inputSchema,
    async handler(input: InputType) {
      const owner =
        repoIdentifier?.owner ?? (input as unknown as { ownerName: string }).ownerName;
      const repo =
        repoIdentifier?.repo ?? (input as unknown as { repoName: string }).repoName;
      const branch =
        repoIdentifier?.branch ??
        ((input as unknown as { branchName?: string }).branchName || 'main');
      const dirPath = input.dirPath;

      const options = {
        showSize: input.showSize,
        maxDepth: input.maxDepth,
        showStats: input.showStats,
        fileExtFilter: input.fileExtFilter,
      };

      const treeResponse = await fetcher.fetchDirectoryTree(owner, repo, branch, dirPath);
      const formattedTree = formatSubTree(treeResponse, dirPath, options);

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
