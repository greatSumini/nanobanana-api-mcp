# Nanobanana MCP - Docker Image
# Multi-stage build for optimal image size

# ----- Build Stage -----
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json tsconfig.json ./

# Copy source code
COPY src ./src

# Install dependencies and build
RUN npm ci && npm run build

# ----- Production Stage -----
FROM node:lts-alpine
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy package files for production install
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --production --ignore-scripts && \
    npm cache clean --force

# Expose MCP server port
EXPOSE 3000

# Set default environment variables
ENV PORT=3000 \
    NODE_ENV=production \
    GOOGLE_API_KEY=""

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/mcp', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the MCP server
CMD ["node", "dist/server.js"]
