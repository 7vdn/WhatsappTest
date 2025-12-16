# Healthcheck Configuration for Coolify

## Overview
This guide explains how to configure health checks in Coolify for the WhatsApp API application.

## Why Health Checks Matter
Coolify uses health checks to determine if your application is running correctly. Without proper health check configuration, Coolify will mark your application as "Degraded (unhealthy)" even if it's running.

## Available Health Endpoints

### 1. `/health` (Recommended)
- **Path**: `/health`
- **Response**: `{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}`
- **Use Case**: Simple health check for Coolify
- **Advantages**: 
  - Responds immediately
  - No dependencies on database or other services
  - Registered early in server startup

### 2. `/api/health` (Detailed)
- **Path**: `/api/health`
- **Response**: 
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "whatsapp": {
      "connected": false
    }
  }
  ```
- **Use Case**: Monitoring and debugging
- **Advantages**: Provides detailed application status

## Coolify Configuration

### Step 1: Open Healthcheck Settings
1. Go to your application in Coolify
2. Click **Configuration** tab
3. Scroll down to **Healthcheck** section

### Step 2: Configure Health Check
Enter the following settings:

| Setting | Value | Description |
|---------|-------|-------------|
| **Path** | `/health` | The endpoint to check |
| **Port** | `3000` | Must match PORT environment variable |
| **Interval** | `30s` | How often to check (recommended: 30-60s) |
| **Timeout** | `5s` | Max time to wait for response |
| **Retries** | `3` | Number of failures before marking unhealthy |
| **Start Period** | `60s` | Grace period during startup |

### Step 3: Save and Redeploy
1. Click **Save**
2. Go to **Deployments** tab
3. Click **Redeploy** or **Restart**

## Testing Health Checks

### Local Testing
```bash
# Start the server
npm run build
npm run start

# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Production Testing
```bash
# Replace with your actual domain
curl https://your-app.domain.com/health
```

## Troubleshooting

### Issue: Still showing "Degraded (unhealthy)"

**Possible Causes:**
1. Health check path is incorrect
2. Port mismatch (check PORT environment variable)
3. Application is not fully started
4. Timeout is too short

**Solutions:**
1. Verify health check path is exactly `/health`
2. Ensure PORT environment variable is set to `3000`
3. Increase "Start Period" to `90s` or `120s`
4. Check application logs for errors

### Issue: Health check returns 404

**Cause:** Application routes not properly registered

**Solution:**
1. Check that server is running
2. Verify `/health` endpoint is registered in `server/index.ts`
3. Check application logs for startup errors

### Issue: Health check times out

**Possible Causes:**
1. Server is not listening on correct port
2. Firewall blocking health checks
3. Application is stuck during startup

**Solutions:**
1. Check logs: `serving on port 3000` should appear
2. Verify PORT environment variable
3. Check for errors in application startup

## Best Practices

1. **Use `/health` for Coolify**: Simple and reliable
2. **Set reasonable intervals**: 30-60 seconds is usually sufficient
3. **Allow startup time**: Set start period to 60-90 seconds
4. **Monitor both endpoints**: Use `/api/health` for detailed monitoring
5. **Check logs regularly**: Look for patterns in health check failures

## Example Coolify Configuration

```yaml
healthcheck:
  path: /health
  port: 3000
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 60s
```

## Additional Resources

- [Coolify Health Checks Documentation](https://coolify.io/docs/knowledge-base/docker/healthcheck)
- [Docker Health Check Best Practices](https://docs.docker.com/engine/reference/builder/#healthcheck)
