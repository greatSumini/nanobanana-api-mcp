/**
 * Parsed repository identifier from CLI arguments
 */
export interface RepoIdentifier {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Configuration for the MCP server
 */
export interface ServerConfig {
  repoIdentifier?: RepoIdentifier;
}

/**
 * Input for fetch-file tool when repoIdentifier is provided
 */
export interface FetchFileInputWithRepo {
  filePath: string;
}

/**
 * Input for fetch-file tool when repoIdentifier is NOT provided
 */
export interface FetchFileInputWithoutRepo {
  ownerName: string;
  repoName: string;
  branchName?: string;
  filePath: string;
}

/**
 * Input for fetch-subdir-tree tool when repoIdentifier is provided
 */
export interface FetchSubdirTreeInputWithRepo {
  dirPath: string;
}

/**
 * Input for fetch-subdir-tree tool when repoIdentifier is NOT provided
 */
export interface FetchSubdirTreeInputWithoutRepo {
  ownerName: string;
  repoName: string;
  branchName?: string;
  dirPath: string;
}

/**
 * GitHub API tree item
 */
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * GitHub API tree response
 */
export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

/**
 * Result from fetching file content
 */
export interface FetchFileResult {
  content: string;
  filePath: string;
}

/**
 * Result from fetching directory tree
 */
export interface FetchTreeResult {
  tree: string;
  dirPath: string;
}

/**
 * Options for enhanced sub-tree formatting
 */
export interface SubTreeOptions {
  showSize?: boolean;        // Show file sizes (default: false)
  maxDepth?: number;         // Maximum depth to traverse (default: unlimited)
  showStats?: boolean;       // Show statistics summary (default: true)
  fileExtFilter?: string[];  // Filter by file extensions (e.g., ['.ts', '.js'])
}

/**
 * Statistics for tree structure
 */
export interface TreeStats {
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  filteredExtensions?: string[];
  depthLimited?: number;
}
