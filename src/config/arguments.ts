import type { RepoIdentifier } from '../types/index.js';

/**
 * Parses a repository identifier string in the format "ownerName/repoName/branchName"
 * @param repoIdentifier - The repository identifier string
 * @returns Parsed RepoIdentifier object
 * @throws Error if the format is invalid
 */
export function parseRepoIdentifier(repoIdentifier: string): RepoIdentifier {
  const parts = repoIdentifier.split('/');

  if (parts.length !== 3) {
    throw new Error(
      'Invalid repoIdentifier format. Expected: ownerName/repoName/branchName'
    );
  }

  const [owner, repo, branch] = parts;

  if (!owner || !repo || !branch) {
    throw new Error(
      'Invalid repoIdentifier: owner, repo, and branch must not be empty'
    );
  }

  return {
    owner,
    repo,
    branch,
  };
}

/**
 * Parses command-line arguments to extract repository identifier
 * @param args - Command line arguments (typically process.argv)
 * @returns RepoIdentifier if --repoIdentifier is provided, undefined otherwise
 */
export function parseArgs(args: string[]): RepoIdentifier | undefined {
  const repoIdentifierIndex = args.findIndex((arg) => arg === '--repoIdentifier');

  if (repoIdentifierIndex === -1) {
    return undefined;
  }

  const repoIdentifierValue = args[repoIdentifierIndex + 1];

  if (!repoIdentifierValue || repoIdentifierValue.startsWith('--')) {
    throw new Error('--repoIdentifier flag requires a value');
  }

  return parseRepoIdentifier(repoIdentifierValue);
}
