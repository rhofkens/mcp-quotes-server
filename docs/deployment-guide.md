# MCP Quotes Server Deployment Guide

This guide provides comprehensive instructions for deploying the MCP Quotes Server in various environments, from local development to production deployments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Operating System**: Linux, macOS, or Windows
- **Memory**: Minimum 512MB RAM, recommended 1GB+
- **Storage**: Minimum 100MB free space

### External Dependencies

- **Serper.dev API Key**: Required for quote retrieval functionality
  - Sign up at [serper.dev](https://serper.dev)
  - Generate an API key from your dashboard
  - Free tier available with rate limiting

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd mcp-quotes-server

# Install dependencies
npm install

# Verify installation
npm run build
```

### Step 2: Environment Configuration

Create a `.env` file in the project root:

```bash
# Required: Serper.dev API key
SERPER_API_KEY=your-serper-api-key-here

# Optional: Logging configuration
LOG_LEVEL=info
LOG_FILE_PATH=./combined.log
LOG_ERROR_FILE_PATH=./errors.log

# Optional: HTTP transport (disabled by default)
MCP_HTTP_ENABLED=false
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=localhost
MCP_HTTP_ALLOWED_ORIGINS=http://localhost:3000
MCP_HTTP_ALLOWED_HOSTS=localhost

# Optional: HTTPS configuration
MCP_HTTPS_ENABLED=false
MCP_HTTPS_CERT_PATH=
MCP_HTTPS_KEY_PATH=
```

### Step 3: Development Workflow

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Step 4: Testing the Server

```bash
# Test with MCP Inspector
npm install -g @modelcontextprotocol/inspector
npm run build
mcp-inspector

# Test with direct execution
node dist/start.js
```

## Environment Variables

### Required Variables

| Variable         | Description                    | Example                           |
| ---------------- | ------------------------------ | --------------------------------- |
| `SERPER_API_KEY` | Serper.dev API key for quotes  | `abc123def456ghi789jkl012`        |

### HTTP Transport Variables

| Variable                   | Description                                | Default                 | Example                              |
| -------------------------- | ------------------------------------------ | ----------------------- | ------------------------------------ |
| `MCP_HTTP_ENABLED`         | Enable HTTP transport                      | `false`                 | `true`                               |
| `MCP_HTTP_PORT`            | HTTP server port                           | `3000`                  | `8080`                               |
| `MCP_HTTP_HOST`            | HTTP server bind address                   | `localhost`             | `0.0.0.0`                            |
| `MCP_HTTP_ALLOWED_ORIGINS` | CORS allowed origins (comma-separated)    | `http://localhost:3000` | `https://site1.com,https://site2.com` |
| `MCP_HTTP_ALLOWED_HOSTS`   | DNS rebinding protection (comma-separated) | `localhost`             | `localhost,127.0.0.1,example.com`   |

### HTTPS Configuration Variables

| Variable              | Description                   | Default | Example                    |
| --------------------- | ----------------------------- | ------- | -------------------------- |
| `MCP_HTTPS_ENABLED`   | Enable HTTPS support          | `false` | `true`                     |
| `MCP_HTTPS_CERT_PATH` | Path to SSL certificate file  | -       | `/etc/ssl/certs/cert.pem`  |
| `MCP_HTTPS_KEY_PATH`  | Path to SSL private key file  | -       | `/etc/ssl/private/key.pem` |

### Logging Variables

| Variable               | Description                 | Default           | Example            |
| ---------------------- | --------------------------- | ----------------- | ------------------ |
| `LOG_LEVEL`            | Logging level               | `info`            | `debug`, `warn`    |
| `LOG_FILE_PATH`        | Path to main log file       | `./combined.log`  | `/var/log/mcp.log` |
| `LOG_ERROR_FILE_PATH`  | Path to error log file      | `./errors.log`    | `/var/log/error.log` |

## Production Deployment

### Option 1: Traditional Server Deployment

#### Step 1: Server Preparation

```bash
# Update system packages (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 2: Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/mcp-quotes-server
sudo chown $USER:$USER /opt/mcp-quotes-server
cd /opt/mcp-quotes-server

# Deploy application files
git clone <repository-url> .
npm install --production
npm run build

# Set up environment variables
sudo tee /opt/mcp-quotes-server/.env << EOF
SERPER_API_KEY=your-production-api-key
LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/mcp-quotes-server/combined.log
LOG_ERROR_FILE_PATH=/var/log/mcp-quotes-server/errors.log
MCP_HTTP_ENABLED=true
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_ALLOWED_ORIGINS=https://yourdomain.com
MCP_HTTP_ALLOWED_HOSTS=yourdomain.com,localhost
EOF
```

#### Step 3: System Service Setup

Create a systemd service file:

```bash
# Create service file
sudo tee /etc/systemd/system/mcp-quotes-server.service << EOF
[Unit]
Description=MCP Quotes Server
After=network.target

[Service]
Type=simple
User=mcp-server
Group=mcp-server
WorkingDirectory=/opt/mcp-quotes-server
Environment=NODE_ENV=production
EnvironmentFile=/opt/mcp-quotes-server/.env
ExecStart=/usr/bin/node dist/start.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create dedicated user
sudo useradd -r -s /bin/false mcp-server
sudo chown -R mcp-server:mcp-server /opt/mcp-quotes-server

# Create log directory
sudo mkdir -p /var/log/mcp-quotes-server
sudo chown mcp-server:mcp-server /var/log/mcp-quotes-server

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mcp-quotes-server
sudo systemctl start mcp-quotes-server

# Check service status
sudo systemctl status mcp-quotes-server
```

### Option 2: Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
tee ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'mcp-quotes-server',
    script: 'dist/start.js',
    cwd: '/opt/mcp-quotes-server',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/mcp-quotes-server/pm2-errors.log',
    out_file: '/var/log/mcp-quotes-server/pm2-out.log',
    log_file: '/var/log/mcp-quotes-server/pm2-combined.log'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Docker Deployment

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# Start the application
CMD ["node", "dist/start.js"]
```

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  mcp-quotes-server:
    build: .
    container_name: mcp-quotes-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SERPER_API_KEY=${SERPER_API_KEY}
      - MCP_HTTP_ENABLED=true
      - MCP_HTTP_PORT=3000
      - MCP_HTTP_HOST=0.0.0.0
      - MCP_HTTP_ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - MCP_HTTP_ALLOWED_HOSTS=${ALLOWED_HOSTS}
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Reverse proxy with Nginx
  nginx:
    image: nginx:alpine
    container_name: mcp-quotes-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - mcp-quotes-server
```

### Docker Deployment Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale the service
docker-compose up -d --scale mcp-quotes-server=3

# Update deployment
docker-compose pull
docker-compose up -d

# Stop services
docker-compose down
```

## Security Considerations

### HTTPS Configuration

#### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update environment variables
MCP_HTTPS_ENABLED=true
MCP_HTTPS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
MCP_HTTPS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# Ubuntu/Debian with UFW
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # or your custom port
sudo ufw allow 443/tcp   # for HTTPS
sudo ufw enable

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Security Headers

Configure your reverse proxy (Nginx example):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### Log Configuration

The server uses Winston for structured logging. Configure log levels based on environment:

- **Development**: `debug` or `info`
- **Staging**: `info` or `warn`
- **Production**: `warn` or `error`

### Log Rotation

Set up log rotation to prevent disk space issues:

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/mcp-quotes-server << EOF
/var/log/mcp-quotes-server/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 mcp-server mcp-server
    postrotate
        systemctl reload mcp-quotes-server
    endscript
}
EOF
```

### Health Monitoring

#### Health Check Endpoint

The server exposes a health check endpoint when HTTP transport is enabled:

```bash
# Check health status
curl http://localhost:3000/health

# Expected response
{"status":"healthy","timestamp":"2024-01-01T00:00:00.000Z"}
```

#### System Monitoring

Monitor key metrics:

- **CPU Usage**: Should remain below 80%
- **Memory Usage**: Monitor for memory leaks
- **Disk Space**: Ensure adequate space for logs
- **Network**: Monitor API response times

Example monitoring script:

```bash
#!/bin/bash
# monitor.sh

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/mcp-quotes-server/monitor.log"

# Check health endpoint
if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "$(date): Health check PASSED" >> "$LOG_FILE"
else
    echo "$(date): Health check FAILED" >> "$LOG_FILE"
    # Send alert (email, Slack, etc.)
fi

# Check disk space
DISK_USAGE=$(df /var/log/mcp-quotes-server | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "$(date): Disk usage critical: ${DISK_USAGE}%" >> "$LOG_FILE"
fi
```

## Performance Optimization

### Node.js Optimization

```bash
# Set Node.js options for production
export NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"

# Use cluster mode for multiple CPU cores
npm install -g pm2
pm2 start dist/start.js -i max
```

### Caching Strategies

Consider implementing caching for frequently requested quotes:

- **In-memory caching**: Redis for session data
- **API response caching**: Cache popular quotes
- **CDN**: Use CloudFlare or similar for static assets

### Load Balancing

For high-traffic deployments, consider load balancing:

```nginx
upstream mcp_quotes_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://mcp_quotes_backend;
    }
}
```

## Troubleshooting

### Common Deployment Issues

#### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
export MCP_HTTP_PORT=3001
```

#### Permission Denied

```bash
# Fix file permissions
sudo chown -R mcp-server:mcp-server /opt/mcp-quotes-server
sudo chmod -R 755 /opt/mcp-quotes-server

# Fix log directory permissions
sudo chown -R mcp-server:mcp-server /var/log/mcp-quotes-server
sudo chmod -R 755 /var/log/mcp-quotes-server
```

#### Service Won't Start

```bash
# Check service status
sudo systemctl status mcp-quotes-server

# View detailed logs
sudo journalctl -u mcp-quotes-server -f

# Check configuration
sudo systemctl show mcp-quotes-server
```

#### SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in /path/to/certificate.pem -text -noout

# Check certificate chain
openssl verify -CAfile /path/to/ca-bundle.pem /path/to/certificate.pem

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

### Performance Issues

#### High Memory Usage

```bash
# Monitor memory usage
ps aux | grep node

# Use Node.js heap dump
kill -USR2 <node-pid>

# Analyze with clinic.js
npm install -g clinic
clinic doctor -- node dist/start.js
```

#### Slow API Responses

```bash
# Check API latency
curl -w "Time: %{time_total}s\n" http://localhost:3000/health

# Monitor logs for errors
tail -f /var/log/mcp-quotes-server/combined.log

# Check external API status
curl -w "Time: %{time_total}s\n" https://google.serper.dev/search
```

### Log Analysis

```bash
# Search for errors
grep -i error /var/log/mcp-quotes-server/combined.log

# Monitor real-time logs
tail -f /var/log/mcp-quotes-server/combined.log

# Count error types
grep -i error /var/log/mcp-quotes-server/combined.log | sort | uniq -c
```

## Rollback Procedures

### Quick Rollback

```bash
# With systemd service
sudo systemctl stop mcp-quotes-server
cd /opt/mcp-quotes-server
git checkout <previous-commit>
npm install
npm run build
sudo systemctl start mcp-quotes-server

# With PM2
pm2 stop mcp-quotes-server
pm2 start ecosystem.config.js
```

### Database/State Rollback

Since this is a stateless service, rollback mainly involves:

1. Reverting code changes
2. Restoring environment configuration
3. Restarting the service

No database migrations or data rollback needed.

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review logs for errors and performance issues
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and update SSL certificates
4. **As needed**: Scale resources based on usage patterns

### Backup Considerations

While this service is stateless, consider backing up:

- Configuration files (`.env`, service files)
- SSL certificates
- Log files (for audit purposes)
- Custom configurations

### Getting Help

For deployment issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Check system logs (`journalctl` or `/var/log/`)
4. Consult the project documentation
5. Open an issue with detailed error information

---

This deployment guide should help you successfully deploy the MCP Quotes Server in various environments. For additional help or specific deployment scenarios, please refer to the main documentation or open an issue.