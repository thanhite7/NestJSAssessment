# Multi-stage build for optimized production image with crypto support
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl-dev

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build

# Production stage with enhanced crypto support
FROM node:20-alpine AS production

# Install runtime dependencies for better crypto and security support
RUN apk add --no-cache \
    dumb-init \
    openssl \
    ca-certificates \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Set NODE_ENV and other environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Create app directory
WORKDIR /app

# Copy built application and node_modules from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').request({hostname:'localhost',port:3000,path:'/api/v1/health',timeout:5000},res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1)).end()"

# Use dumb-init to handle signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Set environment variables for better crypto support
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"
ENV TZ=UTC

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for better signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
