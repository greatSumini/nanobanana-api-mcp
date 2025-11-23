# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nanobanana MCP is a Model Context Protocol (MCP) server that enables LLMs to fetch files and directory trees from GitHub repositories. The server can be configured with a default repository or work with per-request repository parameters.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Type checking without emitting files
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm test                    # Run all tests
npm run test:watch         # Watch mode for TDD
npm run test:coverage      # Generate coverage report

# Run the server (after building)
npm start

# Pre-publish validation (runs lint, typecheck, build, and test)
npm run prepublishOnly
```

## Architecture

### Transport Modes

The server supports two transport modes:
- **Stdio (default)**: Standard input/output for MCP client integration
- **HTTP**: HTTP server mode on configurable port (default: 5000)

**Key architectural decision**: Each HTTP request creates a fresh `McpServer` instance and transport to prevent request ID collisions in concurrent scenarios.

### Repository Configuration Modes

The server operates in two distinct modes:

1. **With repoIdentifier** (CLI argument `--repoIdentifier owner/repo/branch`): All tools default to this repository, requiring only paths from the user.
2. **Without repoIdentifier**: Tools require full repository coordinates (owner, repo, branch) for each request.

This dual-mode design is implemented via conditional Zod schemas in each tool's `createTool` function (see src/tools/*.ts).

### Module Structure

- **src/server.ts**: Entry point, CLI parsing, server lifecycle, transport setup
- **src/config/arguments.ts**: Repository identifier parsing and validation
- **src/services/github-fetcher.ts**: GitHub API integration (raw files, tree API)
- **src/services/tree-formatter.ts**: Basic unix-style tree formatting
- **src/services/enhanced-tree-formatter.ts**: Advanced tree formatting with sizes, depth limits, filtering
- **src/tools/**: MCP tool implementations (fetch-file, fetch-subdir-tree, fetch-sub-tree)
- **src/types/index.ts**: TypeScript interfaces and types
- **src/utils/path-utils.ts**: Path normalization utilities

### Tool Creation Pattern

Each tool follows this pattern:
```typescript
export function createToolName(fetcher: GitHubFetcher, repoIdentifier?: RepoIdentifier) {
  // Conditional schema based on repoIdentifier presence
  const inputSchema = repoIdentifier ? /* simpler schema */ : /* full schema */;

  return {
    name: 'tool-name',
    description: /* conditional description */,
    inputSchema,
    async handler(input) {
      // Extract params from repoIdentifier or input
      // Call fetcher service
      // Format and return response
    }
  };
}
```

### GitHub API Integration

- **File fetching**: Uses `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- **Tree fetching**: Uses `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- **Path normalization**: All paths are normalized by removing leading slashes (handled in src/utils/path-utils.ts)

### Testing Strategy

- **Unit tests**: Individual services, tools, and utilities (tests/unit/)
- **Integration tests**: Tool creation and schema validation (tests/integration/)
- **Test isolation**: Uses Jest with ES modules support (`NODE_OPTIONS=--experimental-vm-modules`)
- **Coverage target**: 79 tests covering all core functionality

## Key Implementation Details

### Tree Formatting

Two formatters exist:
1. **tree-formatter.ts**: Basic unix-style tree (used by fetch-subdir-tree)
2. **enhanced-tree-formatter.ts**: Advanced features (used by fetch-sub-tree):
   - File/directory sizes with human-readable formatting
   - Depth limiting (maxDepth parameter)
   - File extension filtering (fileExtFilter parameter)
   - Statistics summary (files, directories, total size)

### Server Lifecycle (HTTP Mode)

The HTTP server implements port fallback:
1. Attempts to bind to specified port
2. On EADDRINUSE, tries next port (up to 10 attempts)
3. Logs actual port used to stderr

### ES Modules Configuration

This project uses ES modules exclusively:
- `"type": "module"` in package.json
- `.js` extensions in all imports (TypeScript convention for ES modules)
- `"module": "ES2022"` in tsconfig.json

## Common Development Tasks

### Adding a New Tool

1. Create tool file in src/tools/ following the tool creation pattern
2. Import and call tool creator in src/server.ts `createServerInstance()`
3. Register tool with `server.registerTool()`
4. Add unit tests in tests/unit/tools/
5. Update integration tests in tests/integration/tools.test.ts

### Testing a Single Test File

```bash
NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/github-fetcher.test.ts
```

### Running a Single Test

```bash
NODE_OPTIONS=--experimental-vm-modules jest -t "test name pattern"
```

## Configuration Files

- **tsconfig.json**: Strict TypeScript config, targets ES2022, outputs to dist/
- **package.json**: Scripts, dependencies, ES module configuration
- **.eslintrc** (if present): TypeScript ESLint rules

## Publishing

The `prepublishOnly` script ensures quality before publishing:
1. Runs linter (fails on warnings)
2. Runs type checker
3. Builds project
4. Runs full test suite

Only proceed with `npm publish` after this passes.
