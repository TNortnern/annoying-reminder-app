# Railway Setup Checklist

Use this checklist to deploy the Annoying Reminder App to Railway.

## ✅ Pre-Deployment Checklist

- [x] GitHub repository created: https://github.com/TNortnern/annoying-reminder-app
- [x] Code pushed to GitHub
- [x] Dockerfile configured
- [x] Railway configuration files added (railway.json, railway.toml)
- [x] Session secret generated
- [x] Documentation created

## 🚀 Railway Deployment Steps

### 1. Create Railway Project
- [ ] Go to https://railway.app/dashboard
- [ ] Click "New Project" button
- [ ] Select "Deploy from GitHub repo"
- [ ] Search and select: `TNortnern/annoying-reminder-app`
- [ ] Wait for initial deployment to complete

### 2. Add PostgreSQL Database
- [ ] In your Railway project, click "+ New" button
- [ ] Select "Database"
- [ ] Choose "Add PostgreSQL"
- [ ] Wait for database to provision (automatic)
- [ ] Verify `DATABASE_URL` variable is set automatically

### 3. Configure Environment Variables

Go to your service → Variables tab and add these one by one:

#### Email Configuration
- [ ] `EMAIL_GATEWAY_API_KEY` = `egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp`
- [ ] `EMAIL_GATEWAY_API_URL` = `https://email-gateway-production.up.railway.app/api/v1/emails`
- [ ] `EMAIL_FROM` = `Prob <prob@tnorthern.com>`
- [ ] `EMAIL_TO` = `traynorthern96@gmail.com`

#### Security Configuration
- [ ] `SESSION_SECRET` = `12044a8fa824f51f21ea969742c61e9b4edb96a53471fabbbba856d8bac6044a`

#### Admin Credentials
- [ ] `ADMIN_EMAIL` = `admin@admin.admin`
- [ ] `ADMIN_PASSWORD` = `Admin1234!`

#### App URL (do this AFTER first deployment)
- [ ] Copy your Railway URL (e.g., `https://annoying-reminder-app-production.up.railway.app`)
- [ ] Add `APP_URL` = `<your-railway-url>`

### 4. Wait for Redeployment
- [ ] After adding variables, Railway will redeploy automatically
- [ ] Wait for deployment to complete (check Deployments tab)
- [ ] Verify deployment status is "Success"

### 5. Run Database Migrations

Open your terminal and run:

```bash
# Navigate to project directory
cd /Users/tnorthern/Documents/projects/pers/annoying-reminder-app

# Link to your Railway project
railway link

# Run database migrations
railway run npm run db:push
```

**Checkboxes:**
- [ ] Linked Railway project successfully
- [ ] Database migrations completed without errors
- [ ] Tables created: users, reminders

### 6. Get Your Railway URL

- [ ] Go to your service in Railway dashboard
- [ ] Click "Settings" tab
- [ ] Find "Domains" section
- [ ] Copy the public domain (e.g., `annoying-reminder-app-production.up.railway.app`)
- [ ] Go back to Variables and update `APP_URL` with this URL

### 7. Verify Deployment

#### Test Login
- [ ] Open your Railway URL in browser
- [ ] Login page loads successfully
- [ ] Enter admin credentials:
  - Email: `admin@admin.admin`
  - Password: `Admin1234!`
- [ ] Successfully logged in and redirected to dashboard

#### Test Reminder Creation
- [ ] Click "New Reminder" button
- [ ] Fill in form:
  - Message: "Test reminder"
  - Frequency: "1 minute"
- [ ] Click "Create Reminder"
- [ ] Reminder appears in dashboard list

#### Test Email & Acknowledgement
- [ ] Wait 1 minute for cron job to run
- [ ] Check email inbox (traynorthern96@gmail.com)
- [ ] Email received with reminder message
- [ ] Click acknowledgement link in email
- [ ] Redirected to success page
- [ ] Go back to dashboard
- [ ] Reminder shows as "Acknowledged" with timestamp

#### Test Reminder Reset
- [ ] Wait for frequency interval to pass
- [ ] Reminder status resets to "Pending"
- [ ] Email sent again after cron job runs

## 🐛 Troubleshooting Checklist

### If Build Fails
- [ ] Check Railway build logs for errors
- [ ] Verify Dockerfile is in repository
- [ ] Ensure all dependencies in package.json
- [ ] Check Node.js version compatibility

### If App Won't Start
- [ ] Verify all environment variables are set
- [ ] Check that `DATABASE_URL` is available
- [ ] Review Railway service logs
- [ ] Ensure port is not hardcoded (use Railway's PORT variable)

### If Database Connection Fails
- [ ] Verify PostgreSQL plugin is added
- [ ] Check `DATABASE_URL` format
- [ ] Ensure migrations have been run
- [ ] Review connection logs

### If Login Doesn't Work
- [ ] Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- [ ] Check `SESSION_SECRET` is configured
- [ ] Ensure users table exists (run migrations)
- [ ] Check browser console for errors

### If Emails Don't Send
- [ ] Verify `EMAIL_GATEWAY_API_KEY` is correct
- [ ] Check `EMAIL_GATEWAY_API_URL` is accessible
- [ ] Ensure `EMAIL_FROM` and `EMAIL_TO` are valid
- [ ] Check Railway logs for email service errors
- [ ] Verify email gateway service is running

### If Cron Job Doesn't Run
- [ ] Check Railway logs for cron execution
- [ ] Verify app is running (not sleeping)
- [ ] Ensure reminder exists in database
- [ ] Check cron task file is included in build

### If Acknowledgement Link Doesn't Work
- [ ] Verify `APP_URL` is set correctly
- [ ] Check URL includes full domain (not localhost)
- [ ] Ensure acknowledgement token is valid
- [ ] Review acknowledgement endpoint logs

## 📝 Important Notes

### Railway Free Tier Limits
- 500 hours/month of execution time
- 100 GB/month of bandwidth
- Apps may sleep after inactivity
- Keep-alive service may be needed for cron jobs

### Security Considerations
- Change admin password after first login
- Rotate `SESSION_SECRET` periodically
- Keep `EMAIL_GATEWAY_API_KEY` secure
- Use environment variables for all secrets

### Monitoring Recommendations
- Check Railway logs daily
- Monitor email delivery rates
- Track cron job execution
- Set up Railway notifications

## 📚 Additional Resources

- **Full Deployment Guide:** `RAILWAY_DEPLOYMENT.md`
- **Deployment Summary:** `DEPLOYMENT_SUMMARY.md`
- **GitHub Repository:** https://github.com/TNortnern/annoying-reminder-app
- **Railway Dashboard:** https://railway.app/dashboard
- **Railway Docs:** https://docs.railway.app

## ✨ Post-Deployment Tasks

After successful deployment:

- [ ] Update admin password through UI
- [ ] Create real reminders for personal use
- [ ] Set up custom domain (optional)
- [ ] Configure Railway notifications
- [ ] Document your Railway URL for future reference
- [ ] Test complete flow multiple times
- [ ] Monitor logs for first 24 hours

---

**Generated Session Secret:** `12044a8fa824f51f21ea969742c61e9b4edb96a53471fabbbba856d8bac6044a`

**GitHub Repository:** https://github.com/TNortnern/annoying-reminder-app

**Railway Login:** traynorthern@yahoo.com
