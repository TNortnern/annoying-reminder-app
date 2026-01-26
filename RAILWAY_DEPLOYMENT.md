# Railway Deployment Guide

## Overview
This guide will walk you through deploying the Annoying Reminder App to Railway.

## Prerequisites
- GitHub repository: https://github.com/TNortnern/annoying-reminder-app
- Railway account (logged in as traynorthern@yahoo.com)
- Railway CLI installed (version 4.11.1)

## Deployment Steps

### 1. Create Railway Project (Web Dashboard)

Since the Railway CLI requires interactive input, use the Railway web dashboard:

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose the repository: `TNortnern/annoying-reminder-app`
5. Railway will automatically detect the Dockerfile and start the deployment

### 2. Add PostgreSQL Database

After the project is created:

1. In your Railway project dashboard, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically provision the database and set the `DATABASE_URL` environment variable

### 3. Configure Environment Variables

In your Railway project, go to the Variables tab and add the following:

**Required Environment Variables:**

```bash
# Database (automatically set by PostgreSQL plugin)
DATABASE_URL=${DATABASE_URL}

# Email Service Configuration
EMAIL_GATEWAY_API_KEY=egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp
EMAIL_GATEWAY_API_URL=https://email-gateway-production.up.railway.app/api/v1/emails
EMAIL_FROM=Prob <prob@tnorthern.com>
EMAIL_TO=traynorthern96@gmail.com

# Session Security
SESSION_SECRET=12044a8fa824f51f21ea969742c61e9b4edb96a53471fabbbba856d8bac6044a

# Admin Credentials
ADMIN_EMAIL=admin@admin.admin
ADMIN_PASSWORD=Admin1234!

# Application URL (update after first deployment)
APP_URL=https://your-app-name.up.railway.app
```

### 4. Update APP_URL After First Deployment

1. After the first deployment completes, Railway will provide you with a public URL
2. Copy that URL (format: `https://your-app-name.up.railway.app`)
3. Go back to Variables tab and update `APP_URL` with the actual Railway URL
4. The app will automatically redeploy with the updated variable

### 5. Run Database Migrations

After the first deployment, you need to run the database migrations:

**Option A: Using Railway CLI (from terminal):**
```bash
railway link
railway run npm run db:push
```

**Option B: Using Railway Dashboard:**
1. Go to your service settings
2. Add a one-time deployment command: `npm run db:push`
3. Or connect to the database directly and run migrations

### 6. Verify Deployment

Once deployment is complete:

1. Visit your Railway URL
2. Try logging in with admin credentials:
   - Email: `admin@admin.admin`
   - Password: `Admin1234!`
3. Create a test reminder to verify everything works

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `EMAIL_GATEWAY_API_KEY` | Email service API key | `egw_live_...` |
| `EMAIL_GATEWAY_API_URL` | Email service endpoint | `https://email-gateway-production.up.railway.app/api/v1/emails` |
| `EMAIL_FROM` | Sender email address | `Prob <prob@tnorthern.com>` |
| `EMAIL_TO` | Recipient email address | `traynorthern96@gmail.com` |
| `SESSION_SECRET` | Session encryption key | Generated 64-char hex string |
| `ADMIN_EMAIL` | Admin login email | `admin@admin.admin` |
| `ADMIN_PASSWORD` | Admin login password | `Admin1234!` |
| `APP_URL` | Public application URL | `https://your-app.up.railway.app` |

## Generated Session Secret

A secure session secret has been generated for this deployment:
```
12044a8fa824f51f21ea969742c61e9b4edb96a53471fabbbba856d8bac6044a
```

## Troubleshooting

### Build Fails
- Check that the Dockerfile is properly configured
- Verify all npm dependencies are installed
- Check Railway build logs for specific errors

### Database Connection Issues
- Ensure PostgreSQL plugin is added to the project
- Verify `DATABASE_URL` is available in environment variables
- Check that migrations have been run

### Email Not Sending
- Verify `EMAIL_GATEWAY_API_KEY` is correct
- Check that `EMAIL_GATEWAY_API_URL` is accessible
- Confirm `EMAIL_FROM` and `EMAIL_TO` are valid email addresses

### Login Not Working
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set correctly
- Check that `SESSION_SECRET` is configured
- Ensure database migrations have created the users table

## Railway Configuration Files

The project includes two Railway configuration files:

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node .output/server/index.mjs",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**railway.toml:**
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node .output/server/index.mjs"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Next Steps

After successful deployment:

1. Test the complete flow:
   - Login as admin
   - Create a reminder
   - Wait for the cron job to send the email
   - Click the acknowledgement link in the email
   - Verify the reminder is marked as acknowledged

2. Monitor the application:
   - Check Railway logs for any errors
   - Verify cron job is running every minute
   - Monitor email delivery

3. (Optional) Configure custom domain:
   - Go to Railway project settings
   - Add your custom domain
   - Update `APP_URL` environment variable with custom domain

## Support

If you encounter issues:
- Check Railway deployment logs
- Review environment variables
- Verify database connection
- Check email service status
