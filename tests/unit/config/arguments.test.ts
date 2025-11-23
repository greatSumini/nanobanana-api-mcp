import { parseRepoIdentifier, parseArgs } from '../../../src/config/arguments.js';

describe('parseRepoIdentifier', () => {
  it('should parse valid repoIdentifier with branch', () => {
    const result = parseRepoIdentifier('facebook/react/main');
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'main',
    });
  });

  it('should parse valid repoIdentifier with different branch', () => {
    const result = parseRepoIdentifier('microsoft/vscode/develop');
    expect(result).toEqual({
      owner: 'microsoft',
      repo: 'vscode',
      branch: 'develop',
    });
  });

  it('should handle owner/repo names with hyphens and underscores', () => {
    const result = parseRepoIdentifier('my-org/my_repo/feature-branch');
    expect(result).toEqual({
      owner: 'my-org',
      repo: 'my_repo',
      branch: 'feature-branch',
    });
  });

  it('should throw error for invalid format (missing parts)', () => {
    expect(() => parseRepoIdentifier('facebook/react')).toThrow(
      'Invalid repoIdentifier format. Expected: ownerName/repoName/branchName'
    );
  });

  it('should throw error for invalid format (too many parts)', () => {
    expect(() => parseRepoIdentifier('facebook/react/main/extra')).toThrow(
      'Invalid repoIdentifier format. Expected: ownerName/repoName/branchName'
    );
  });

  it('should throw error for empty string', () => {
    expect(() => parseRepoIdentifier('')).toThrow(
      'Invalid repoIdentifier format. Expected: ownerName/repoName/branchName'
    );
  });

  it('should throw error for empty owner', () => {
    expect(() => parseRepoIdentifier('/react/main')).toThrow(
      'Invalid repoIdentifier: owner, repo, and branch must not be empty'
    );
  });

  it('should throw error for empty repo', () => {
    expect(() => parseRepoIdentifier('facebook//main')).toThrow(
      'Invalid repoIdentifier: owner, repo, and branch must not be empty'
    );
  });

  it('should throw error for empty branch', () => {
    expect(() => parseRepoIdentifier('facebook/react/')).toThrow(
      'Invalid repoIdentifier: owner, repo, and branch must not be empty'
    );
  });
});

describe('parseArgs', () => {
  it('should return undefined when --repoIdentifier is not provided', () => {
    const result = parseArgs(['node', 'server.js']);
    expect(result).toBeUndefined();
  });

  it('should parse --repoIdentifier from command line args', () => {
    const result = parseArgs([
      'node',
      'server.js',
      '--repoIdentifier',
      'facebook/react/main',
    ]);
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'main',
    });
  });

  it('should parse --repoIdentifier with other flags', () => {
    const result = parseArgs([
      'node',
      'server.js',
      '--port',
      '3000',
      '--repoIdentifier',
      'microsoft/vscode/develop',
      '--verbose',
    ]);
    expect(result).toEqual({
      owner: 'microsoft',
      repo: 'vscode',
      branch: 'develop',
    });
  });

  it('should throw error when --repoIdentifier has no value', () => {
    expect(() =>
      parseArgs(['node', 'server.js', '--repoIdentifier'])
    ).toThrow('--repoIdentifier flag requires a value');
  });

  it('should throw error when --repoIdentifier value is another flag', () => {
    expect(() =>
      parseArgs(['node', 'server.js', '--repoIdentifier', '--port'])
    ).toThrow('--repoIdentifier flag requires a value');
  });

  it('should throw error when --repoIdentifier value is invalid', () => {
    expect(() =>
      parseArgs(['node', 'server.js', '--repoIdentifier', 'invalid'])
    ).toThrow('Invalid repoIdentifier format. Expected: ownerName/repoName/branchName');
  });
});
