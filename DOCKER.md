# Docker Deployment Guide

This guide provides detailed instructions for deploying Plex Share Manager using Docker.

## Quick Start

1. Clone the repository and navigate to the project directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` with your Plex credentials
4. Start the application:
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

The following environment variables are required:

- `PLEX_SERVER_URL` - Your Plex server URL (e.g., `http://localhost:32400`)
- `PLEX_AUTH_TOKEN` - Your Plex authentication token
- `PLEX_SERVER_ID` - Your Plex server ID

### Port Configuration

By default, the application runs on port 3000. To change this, edit the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Changes external port to 8080
```

## Docker Compose Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### Restart the application
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f plex-share-manager
```

### Rebuild the image
```bash
docker-compose up -d --build
```

### Remove everything (including volumes)
```bash
docker-compose down -v
```

## Networking

### Connecting to Plex in Docker

If your Plex server is also running in Docker, you have several options:

#### Option 1: Same Docker Compose File
Add your Plex service to the same `docker-compose.yml` and reference it by service name:

```yaml
services:
  plex:
    image: plexinc/pms-docker
    # ... plex configuration

  plex-share-manager:
    # ... existing configuration
    environment:
      - PLEX_SERVER_URL=http://plex:32400
```

#### Option 2: External Network
Connect to an existing Docker network where Plex is running:

```yaml
networks:
  plex-network:
    external: true
    name: your-existing-plex-network
```

#### Option 3: Host Network Mode
Use host networking (Linux only):

```yaml
services:
  plex-share-manager:
    network_mode: host
    # Remove the ports section when using host mode
```

### Connecting to Plex on Host Machine

When Plex runs directly on your host machine (not in Docker):

- **Windows/Mac**: Use `host.docker.internal` instead of `localhost`
  ```env
  PLEX_SERVER_URL=http://host.docker.internal:32400
  ```

- **Linux**: Use the host IP address or add `--add-host=host.docker.internal:host-gateway` to the docker run command

## Production Deployment

### Using Pre-built Image

You can build and tag the image separately:

```bash
# Build the image
docker build -t plex-share-manager:latest .

# Push to registry (optional)
docker tag plex-share-manager:latest your-registry/plex-share-manager:latest
docker push your-registry/plex-share-manager:latest

# Run from registry
docker pull your-registry/plex-share-manager:latest
docker run -d \
  --name plex-share-manager \
  -p 3000:3000 \
  --env-file .env.local \
  your-registry/plex-share-manager:latest
```

### Reverse Proxy Setup

#### Nginx Example

```nginx
server {
    listen 80;
    server_name plex-manager.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Traefik Example

```yaml
services:
  plex-share-manager:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.plex-manager.rule=Host(`plex-manager.yourdomain.com`)"
      - "traefik.http.routers.plex-manager.entrypoints=websecure"
      - "traefik.http.routers.plex-manager.tls.certresolver=myresolver"
```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs plex-share-manager`
- Verify environment variables are set correctly
- Ensure port 3000 is not already in use

### Can't connect to Plex server
- Verify `PLEX_SERVER_URL` is correct
- Check network connectivity between containers
- Ensure Plex token is valid
- Verify Plex server is accessible from the container

### Permission issues
- The container runs as a non-root user (uid 1001)
- Ensure any mounted volumes have correct permissions

### Image size concerns
The multi-stage build creates an optimized production image:
- Base alpine image (~50MB)
- Node.js runtime (~50MB)
- Application code (varies)
- Total: ~200-300MB

## Security Best Practices

1. **Never commit `.env.local`** - Keep credentials secure
2. **Use secrets management** - Consider Docker secrets for production
3. **Keep images updated** - Regularly rebuild with latest base images
4. **Scan for vulnerabilities** - Use `docker scan plex-share-manager`
5. **Use non-root user** - Already configured in the Dockerfile
6. **Limit container resources** - Add resource limits in production:

```yaml
services:
  plex-share-manager:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Updates and Maintenance

### Updating the application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup considerations
- Environment variables should be backed up securely
- No persistent data is stored by the application
- All data is managed by your Plex server

## Performance Tuning

For better performance in production:

1. **Enable Next.js caching** - Already configured in the Dockerfile
2. **Use CDN for static assets** - Configure in your reverse proxy
3. **Monitor memory usage** - Adjust container limits as needed
4. **Enable logging** - Add volume mounts for persistent logs if needed

```yaml
volumes:
  - ./logs:/app/logs
```
