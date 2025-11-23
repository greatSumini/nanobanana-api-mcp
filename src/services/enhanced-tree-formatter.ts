import { normalizePath } from '../utils/path-utils.js';
import type {
  GitHubTreeResponse,
  GitHubTreeItem,
  SubTreeOptions,
  TreeStats,
} from '../types/index.js';

interface EnhancedTreeNode {
  name: string;
  isDirectory: boolean;
  size?: number;
  children: EnhancedTreeNode[];
  depth: number;
}

/**
 * Formats file size to human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/**
 * Checks if file matches extension filter
 */
function matchesExtFilter(fileName: string, extFilter?: string[]): boolean {
  if (!extFilter || extFilter.length === 0) return true;
  return extFilter.some((ext) => fileName.endsWith(ext));
}

/**
 * Builds an enhanced tree structure from flat list of GitHub tree items
 */
function buildEnhancedTree(
  items: GitHubTreeItem[],
  dirPath: string,
  options: SubTreeOptions
): EnhancedTreeNode {
  const root: EnhancedTreeNode = {
    name: '',
    isDirectory: true,
    children: [],
    depth: 0,
  };
  const normalizedDirPath = normalizePath(dirPath);

  // Filter items by directory path
  const filteredItems = items.filter((item) => {
    if (!normalizedDirPath) return true;
    return item.path.startsWith(normalizedDirPath + '/') || item.path === normalizedDirPath;
  });

  // Group by immediate children of the target directory
  const childrenMap = new Map<string, EnhancedTreeNode>();

  for (const item of filteredItems) {
    let relativePath = item.path;

    // Remove the directory path prefix
    if (normalizedDirPath) {
      if (item.path === normalizedDirPath) continue; // Skip the directory itself
      relativePath = item.path.substring(normalizedDirPath.length + 1);
    }

    // Apply extension filter for files
    const parts = relativePath.split('/');
    if (parts.length === 1 && item.type === 'blob') {
      if (!matchesExtFilter(parts[0], options.fileExtFilter)) {
        continue;
      }
    }

    // Get the immediate child name
    const childName = parts[0];

    if (!childrenMap.has(childName)) {
      const isDirectory = parts.length > 1 || item.type === 'tree';
      childrenMap.set(childName, {
        name: childName,
        isDirectory,
        size: isDirectory ? undefined : item.size,
        children: [],
        depth: 1,
      });
    }

    // If there are more parts, this is a nested item
    if (parts.length > 1) {
      const node = childrenMap.get(childName)!;
      node.isDirectory = true;

      // Build nested structure
      const nestedPath = parts.slice(1).join('/');
      addNestedEnhancedNode(node, nestedPath, item, 2, options);
    }
  }

  root.children = Array.from(childrenMap.values()).sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return root;
}

/**
 * Adds a nested node to the enhanced tree
 */
function addNestedEnhancedNode(
  parent: EnhancedTreeNode,
  path: string,
  item: GitHubTreeItem,
  depth: number,
  options: SubTreeOptions
): void {
  const parts = path.split('/');
  const childName = parts[0];

  // Apply extension filter for files
  if (parts.length === 1 && item.type === 'blob') {
    if (!matchesExtFilter(childName, options.fileExtFilter)) {
      return;
    }
  }

  let child = parent.children.find((c) => c.name === childName);

  if (!child) {
    const isDirectory = parts.length > 1 || item.type === 'tree';
    child = {
      name: childName,
      isDirectory,
      size: isDirectory ? undefined : item.size,
      children: [],
      depth,
    };
    parent.children.push(child);
  }

  if (parts.length > 1) {
    child.isDirectory = true;
    addNestedEnhancedNode(child, parts.slice(1).join('/'), item, depth + 1, options);
  }

  // Sort children
  parent.children.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Calculates statistics for the tree
 */
function calculateStats(
  node: EnhancedTreeNode,
  options: SubTreeOptions,
  stats: TreeStats = { totalFiles: 0, totalDirs: 0, totalSize: 0 }
): TreeStats {
  const maxDepth = options.maxDepth ?? Infinity;

  for (const child of node.children) {
    if (child.depth > maxDepth) continue;

    if (child.isDirectory) {
      stats.totalDirs++;
      calculateStats(child, options, stats);
    } else {
      stats.totalFiles++;
      stats.totalSize += child.size ?? 0;
    }
  }

  if (options.fileExtFilter && options.fileExtFilter.length > 0) {
    stats.filteredExtensions = options.fileExtFilter;
  }

  if (options.maxDepth !== undefined) {
    stats.depthLimited = options.maxDepth;
  }

  return stats;
}

/**
 * Calculates directory size (sum of all files in it)
 */
function calculateDirSize(node: EnhancedTreeNode, maxDepth: number): number {
  let totalSize = 0;

  for (const child of node.children) {
    if (child.depth > maxDepth) continue;

    if (child.isDirectory) {
      totalSize += calculateDirSize(child, maxDepth);
    } else {
      totalSize += child.size ?? 0;
    }
  }

  return totalSize;
}

/**
 * Counts files in a directory
 */
function countDirFiles(node: EnhancedTreeNode, maxDepth: number): number {
  let count = 0;

  for (const child of node.children) {
    if (child.depth > maxDepth) continue;

    if (child.isDirectory) {
      count += countDirFiles(child, maxDepth);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Formats enhanced tree node to unix tree format
 */
function formatEnhancedNode(
  node: EnhancedTreeNode,
  prefix: string,
  options: SubTreeOptions,
  maxDepth: number
): string {
  const lines: string[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.depth > maxDepth) continue;

    const isLastChild = i === node.children.length - 1;
    const connector = isLastChild ? '└── ' : '├── ';
    const childPrefix = isLastChild ? '    ' : '│   ';

    let displayName = child.isDirectory ? child.name + '/' : child.name;

    // Add size information if requested
    if (options.showSize) {
      if (child.isDirectory) {
        const dirSize = calculateDirSize(child, maxDepth);
        const fileCount = countDirFiles(child, maxDepth);
        if (fileCount > 0) {
          displayName += ` (${fileCount} ${fileCount === 1 ? 'file' : 'files'}, ${formatSize(dirSize)})`;
        }
      } else if (child.size !== undefined) {
        displayName += ` (${formatSize(child.size)})`;
      }
    }

    lines.push(prefix + connector + displayName);

    // Only recurse if we haven't hit max depth
    if (child.children.length > 0 && child.depth < maxDepth) {
      const childFormatted = formatEnhancedNode(child, prefix + childPrefix, options, maxDepth);
      if (childFormatted) {
        lines.push(childFormatted);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Formats statistics summary
 */
function formatStats(stats: TreeStats): string {
  const parts: string[] = [];

  parts.push(`📊 Summary: ${stats.totalDirs} ${stats.totalDirs === 1 ? 'directory' : 'directories'}`);
  parts.push(`${stats.totalFiles} ${stats.totalFiles === 1 ? 'file' : 'files'}`);

  if (stats.totalSize > 0) {
    parts.push(`${formatSize(stats.totalSize)} total`);
  }

  if (stats.filteredExtensions && stats.filteredExtensions.length > 0) {
    parts.push(`(filtered: ${stats.filteredExtensions.join(', ')})`);
  }

  if (stats.depthLimited !== undefined) {
    parts.push(`(depth limited to ${stats.depthLimited})`);
  }

  return parts.join(', ');
}

/**
 * Formats GitHub tree response to enhanced unix tree format
 * @param treeResponse - GitHub tree API response
 * @param dirPath - Directory path to filter (empty for root)
 * @param options - Formatting options
 * @returns Formatted tree string with optional statistics
 */
export function formatSubTree(
  treeResponse: GitHubTreeResponse,
  dirPath: string,
  options: SubTreeOptions = {}
): string {
  if (treeResponse.tree.length === 0) {
    return '(empty directory)';
  }

  const tree = buildEnhancedTree(treeResponse.tree, dirPath, options);

  if (tree.children.length === 0) {
    return '(empty directory)';
  }

  const maxDepth = options.maxDepth ?? Infinity;
  const lines: string[] = [];

  // Format root level
  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];

    let displayName = child.isDirectory ? child.name + '/' : child.name;

    // Add size information if requested
    if (options.showSize) {
      if (child.isDirectory) {
        const dirSize = calculateDirSize(child, maxDepth);
        const fileCount = countDirFiles(child, maxDepth);
        if (fileCount > 0) {
          displayName += ` (${fileCount} ${fileCount === 1 ? 'file' : 'files'}, ${formatSize(dirSize)})`;
        }
      } else if (child.size !== undefined) {
        displayName += ` (${formatSize(child.size)})`;
      }
    }

    if (child.children.length > 0 && child.depth < maxDepth) {
      lines.push(displayName);
      const childFormatted = formatEnhancedNode(child, '', options, maxDepth);
      if (childFormatted) {
        lines.push(childFormatted);
      }
    } else {
      lines.push(displayName);
    }
  }

  let result = lines.join('\n');

  // Add statistics if requested
  if (options.showStats !== false) {
    const stats = calculateStats(tree, options);
    result += '\n\n' + formatStats(stats);
  }

  return result;
}
