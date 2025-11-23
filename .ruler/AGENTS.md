# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nanobanana API MCP is a Model Context Protocol (MCP) server that enables LLMs to generate and edit images using Google Gemini API. The server supports text-to-image generation, image editing with prompts, reference images for guidance, and aspect ratio customization.

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

### Model Configuration Modes

The server operates with optional fixed model configuration:

1. **With --model flag** (CLI argument `--model pro|normal`): All tools use this fixed model, and the model parameter is hidden from tool schemas.
2. **Without --model flag**: Tools expose a model parameter allowing per-request model selection (default: 'pro').

This dual-mode design is implemented via conditional Zod schemas in each tool's `createTool` function (see src/tools/*.ts).

### Module Structure

- **src/server.ts**: Entry point, CLI parsing, server lifecycle, transport setup
- **src/services/image-generator.ts**: Image generation and editing service using Google Gemini API
- **src/tools/generate-image.ts**: MCP tool for generating images from text prompts
- **src/tools/edit-image.ts**: MCP tool for editing existing images with text prompts

### Tool Creation Pattern

Each tool follows this pattern:
```typescript
export function createToolName(generator: ImageGenerator, fixedModel?: "pro" | "normal") {
  // Conditional schema based on fixedModel presence
  const baseSchema = { /* base parameters */ };
  const inputSchema = fixedModel
    ? z.object(baseSchema)
    : z.object({ ...baseSchema, model: z.enum(["pro", "normal"]) });

  return {
    name: 'tool-name',
    description: /* tool description */,
    inputSchema,
    async handler(input) {
      // Use fixedModel or input.model
      // Call generator service
      // Return response with image path
    }
  };
}
```

### Google Gemini API Integration

- **Models available**:
  - `pro`: gemini-3-pro-image-preview (higher quality)
  - `normal`: gemini-2.5-flash-image (faster)
- **Image generation**: Uses Google Generative AI SDK to generate images from text prompts
  - Optional output_path: saves to file if provided, returns base64 if omitted
- **Image editing**: Uses the same API with image inputs to edit existing images
  - Supports both path-based and base64 input
  - Optional output_path: saves to file if provided, returns base64 if omitted (for base64 input) or overwrites original (for path input)
- **Reference images**: Supports multiple reference images to guide generation/editing
- **Aspect ratios**: Supports 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 (default: 16:9)
- **Output modes**:
  - File-based: Images saved to specified absolute paths
  - Base64: Raw base64 strings returned when output_path is not provided

### Testing Strategy

- **Test framework**: Jest with ES modules support (`NODE_OPTIONS=--experimental-vm-modules`)
- **Test location**: Currently no test files exist (tests/ directory is empty)
- **Test commands**:
  - `npm test`: Run all tests
  - `npm run test:watch`: Watch mode for TDD
  - `npm run test:coverage`: Generate coverage report

## Key Implementation Details

### Image Processing

The ImageGenerator service handles:
1. **API key management**: Accepts key via constructor or GOOGLE_API_KEY environment variable
2. **Image generation**:
   - Accepts text prompt, optional output path, model type, optional reference images, and aspect ratio
   - Builds contents array with prompt and reference images
   - Calls Gemini API with responseModalities: ["TEXT", "IMAGE"]
   - Extracts base64 image data from response
   - Returns base64 string if no output path provided, otherwise saves to file and returns path
3. **Image editing**:
   - Accepts either file path or base64 input with MIME type
   - Similar to generation but includes the source image to edit
   - Supports additional reference images for style guidance
   - Flexible output modes:
     - Path input + no output_path: overwrites original file
     - Path input + output_path: saves to specified path
     - Base64 input + no output_path: returns base64
     - Base64 input + output_path: saves to specified path
4. **File handling**:
   - Automatically creates output directories if they don't exist
   - Supports JPEG, PNG, GIF, and WebP formats
   - Determines MIME type from file extension or uses provided MIME type for base64 input

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
3. Register tool with `server.registerTool()`:
   ```typescript
   server.registerTool(
     toolName.name,
     {
       title: "Tool Title",
       description: toolName.description,
       inputSchema: toolName.inputSchema.shape,
       outputSchema: undefined,
     },
     toolName.handler
   );
   ```
4. Add tests if/when test infrastructure is created

### Testing Commands

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test a specific file (when tests exist)
NODE_OPTIONS=--experimental-vm-modules jest path/to/test.ts

# Run a specific test pattern (when tests exist)
NODE_OPTIONS=--experimental-vm-modules jest -t "test name pattern"
```

## Configuration Files

- **tsconfig.json**: Strict TypeScript config, targets ES2022, outputs to dist/
- **package.json**: Scripts, dependencies, ES module configuration
- **jest.config.js**: Jest configuration for ES modules

## CLI Arguments

The server accepts the following CLI arguments:

- `--transport <stdio|http>`: Transport type (default: stdio)
- `--port <number>`: Port for HTTP transport (default: 5000, only valid with --transport http)
- `--apiKey <key>`: Google API key for image generation (can also use GOOGLE_API_KEY env var)
- `--model <pro|normal>`: Fix model for all operations, hides model parameter from tools (optional)

Examples:
```bash
# Stdio with API key
nanobanana-api-mcp --apiKey "your-key"

# HTTP on port 5000 with fixed pro model
nanobanana-api-mcp --transport http --port 5000 --apiKey "your-key" --model pro

# Using environment variable for API key
export GOOGLE_API_KEY="your-key"
nanobanana-api-mcp
```

## Publishing

The `prepublishOnly` script ensures quality before publishing:
1. Runs linter (fails on warnings)
2. Runs type checker
3. Builds project
4. Runs full test suite

Only proceed with `npm publish` after this passes.

## API Key Requirements

This project requires a Google API key with access to Gemini image generation models. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

The API key can be provided in two ways:
1. CLI argument: `--apiKey "your-api-key"`
2. Environment variable: `GOOGLE_API_KEY="your-api-key"`

If neither is provided, the server will throw an error on initialization.
