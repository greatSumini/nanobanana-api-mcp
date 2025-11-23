/**
 * Normalizes a file path by:
 * - Removing leading and trailing slashes
 * - Converting backslashes to forward slashes
 * - Removing duplicate slashes
 * @param path - The path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+$/, '') // Remove trailing slashes
    .replace(/\/+/g, '/'); // Replace multiple slashes with single slash
}
