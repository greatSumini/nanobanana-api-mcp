import { normalizePath } from '../utils/path-utils.js';
import type { GitHubTreeResponse, GitHubTreeItem } from '../types/index.js';

interface TreeNode {
  name: string;
  isDirectory: boolean;
  children: TreeNode[];
}

/**
 * Builds a tree structure from flat list of GitHub tree items
 */
function buildTree(items: GitHubTreeItem[], dirPath: string): TreeNode {
  const root: TreeNode = { name: '', isDirectory: true, children: [] };
  const normalizedDirPath = normalizePath(dirPath);

  // Filter items by directory path
  const filteredItems = items.filter((item) => {
    if (!normalizedDirPath) return true;
    return item.path.startsWith(normalizedDirPath + '/') || item.path === normalizedDirPath;
  });

  // Group by immediate children of the target directory
  const childrenMap = new Map<string, TreeNode>();

  for (const item of filteredItems) {
    let relativePath = item.path;

    // Remove the directory path prefix
    if (normalizedDirPath) {
      if (item.path === normalizedDirPath) continue; // Skip the directory itself
      relativePath = item.path.substring(normalizedDirPath.length + 1);
    }

    // Get the immediate child name
    const parts = relativePath.split('/');
    const childName = parts[0];

    if (!childrenMap.has(childName)) {
      const isDirectory = parts.length > 1 || item.type === 'tree';
      childrenMap.set(childName, {
        name: childName,
        isDirectory,
        children: [],
      });
    }

    // If there are more parts, this is a nested item
    if (parts.length > 1) {
      const node = childrenMap.get(childName)!;
      node.isDirectory = true;

      // Build nested structure
      const nestedPath = parts.slice(1).join('/');
      addNestedNode(node, nestedPath, item.type === 'tree');
    }
  }

  root.children = Array.from(childrenMap.values()).sort((a, b) => {
    // Files first, then directories
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return root;
}

/**
 * Adds a nested node to the tree
 */
function addNestedNode(parent: TreeNode, path: string, isTree: boolean): void {
  const parts = path.split('/');
  const childName = parts[0];

  let child = parent.children.find((c) => c.name === childName);

  if (!child) {
    child = {
      name: childName,
      isDirectory: parts.length > 1 || isTree,
      children: [],
    };
    parent.children.push(child);
  }

  if (parts.length > 1) {
    child.isDirectory = true;
    addNestedNode(child, parts.slice(1).join('/'), isTree);
  }

  // Sort children
  parent.children.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Formats tree node to unix tree format
 */
function formatNode(node: TreeNode, prefix: string = ''): string {
  const lines: string[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isLastChild = i === node.children.length - 1;
    const connector = isLastChild ? '└── ' : '├── ';
    const childPrefix = isLastChild ? '    ' : '│   ';

    const displayName = child.isDirectory ? child.name + '/' : child.name;
    lines.push(prefix + connector + displayName);

    if (child.children.length > 0) {
      lines.push(formatNode(child, prefix + childPrefix));
    }
  }

  return lines.join('\n');
}

/**
 * Formats GitHub tree response to unix tree format
 * @param treeResponse - GitHub tree API response
 * @param dirPath - Directory path to filter (empty for root)
 * @returns Formatted tree string
 */
export function formatTree(treeResponse: GitHubTreeResponse, dirPath: string): string {
  if (treeResponse.tree.length === 0) {
    return '(empty directory)';
  }

  const tree = buildTree(treeResponse.tree, dirPath);

  if (tree.children.length === 0) {
    return '(empty directory)';
  }

  // For root level, format differently
  const lines: string[] = [];

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];

    const displayName = child.isDirectory ? child.name + '/' : child.name;

    if (child.children.length > 0) {
      lines.push(displayName);
      lines.push(formatNode(child, ''));
    } else {
      lines.push(displayName);
    }
  }

  return lines.join('\n');
}
