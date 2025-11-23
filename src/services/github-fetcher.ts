import { normalizePath } from '../utils/path-utils.js';
import type { GitHubTreeResponse } from '../types/index.js';

/**
 * Service for fetching files and directory trees from GitHub
 */
export class GitHubFetcher {
  /**
   * Fetches the raw content of a file from GitHub
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branch - Branch name
   * @param filePath - Path to the file
   * @returns File content as string
   */
  async fetchFileContent(
    owner: string,
    repo: string,
    branch: string,
    filePath: string
  ): Promise<string> {
    const normalizedPath = normalizePath(filePath);
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${normalizedPath}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Fetches the directory tree from GitHub API
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branch - Branch name
   * @param _dirPath - Path to the directory (unused, for future filtering)
   * @returns GitHub tree API response
   */
  async fetchDirectoryTree(
    owner: string,
    repo: string,
    branch: string,
    _dirPath: string
  ): Promise<GitHubTreeResponse> {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch directory tree: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<GitHubTreeResponse>;
  }
}
