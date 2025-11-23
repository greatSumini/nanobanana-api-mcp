import { z } from 'zod';
import type { RepoIdentifier } from '../types/index.js';
import type { GitHubFetcher } from '../services/github-fetcher.js';

/**
 * Creates the fetch-file tool
 * @param fetcher - GitHub fetcher service
 * @param repoIdentifier - Optional repository identifier from CLI args
 */
export function createFetchFileTool(
  fetcher: GitHubFetcher,
  repoIdentifier?: RepoIdentifier
) {
  // Define schema based on whether repoIdentifier is provided
  const inputSchema = repoIdentifier
    ? z.object({
        filePath: z.string().describe('Path to the file in the repository'),
      })
    : z.object({
        ownerName: z.string().describe('Repository owner name'),
        repoName: z.string().describe('Repository name'),
        branchName: z.string().optional().default('main').describe('Branch name (default: main)'),
        filePath: z.string().describe('Path to the file in the repository'),
      });

  type InputType = z.infer<typeof inputSchema>;

  return {
    name: 'fetch-file',
    description: repoIdentifier
      ? `Fetches file content from GitHub repository ${repoIdentifier.owner}/${repoIdentifier.repo}/${repoIdentifier.branch}`
      : 'Fetches file content from a GitHub repository',
    inputSchema,
    async handler(input: InputType) {
      const owner = repoIdentifier?.owner ?? (input as unknown as { ownerName: string }).ownerName;
      const repo = repoIdentifier?.repo ?? (input as unknown as { repoName: string }).repoName;
      const branch = repoIdentifier?.branch ?? ((input as unknown as { branchName?: string }).branchName || 'main');
      const filePath = input.filePath;

      const content = await fetcher.fetchFileContent(owner, repo, branch, filePath);

      return {
        content: [
          {
            type: 'text' as const,
            text: content,
          },
        ],
      };
    },
  };
}
