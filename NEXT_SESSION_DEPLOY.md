# Next Session: Complete Railway Deployment

## Use browser-use Skill

**Critical:** Use the `browser-use` skill (NOT Claude in Chrome) to complete the deployment with access to the user's Railway account.

## Railway Project Info

- **Project Name:** Persistent Nudge
- **Project ID:** `d1933ec7-00fb-435c-a2dc-c01052fd332f`
- **Project URL:** https://railway.com/project/d1933ec7-00fb-435c-a2dc-c01052fd332f
- **Status:** PostgreSQL database created, app service NOT yet added

## GitHub Repository

- **URL:** https://github.com/TNortnern/annoying-reminder-app
- **Owner:** TNortnern
- **Repo:** annoying-reminder-app

## Deployment Steps

### 1. Add GitHub Repository to Railway Project

Navigate to the Railway project and add the GitHub repository as a service:
1. Go to https://railway.com/project/d1933ec7-00fb-435c-a2dc-c01052fd332f
2. Click "+ Create" or "+ New"
3. Select "GitHub Repository"
4. Search for or select "TNortnern/annoying-reminder-app"
5. Railway will auto-detect the Dockerfile and build

### 2. Configure Environment Variables

Add these environment variables to the annoying-reminder-app service in Railway:

```
DATABASE_URL=${DATABASE_URL}
EMAIL_GATEWAY_API_KEY=egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp
EMAIL_GATEWAY_API_URL=https://email-gateway-production.up.railway.app/api/v1/send
EMAIL_FROM=Prob <prob@tnorthern.com>
EMAIL_TO=traynorthern96@gmail.com
SESSION_SECRET=12044a8fa824f51f21ea969742c61e9b4edb96a53471fabbbba856d8bac6044a
ADMIN_EMAIL=admin@admin.admin
ADMIN_PASSWORD=Admin1234!
NODE_ENV=production
RUN_SEED=true
```

**Note:** `DATABASE_URL` should reference the PostgreSQL database variable using Railway's variable reference syntax.

### 3. Generate Public Domain

1. In the Railway service settings, go to "Settings" tab
2. Click "Generate Domain" or go to "Networking"
3. Generate a Railway public domain
4. Copy the generated URL (e.g., `https://annoying-reminder-app-production.up.railway.app`)

### 4. Update APP_URL

Add one more environment variable with the generated domain:

```
APP_URL=<the-generated-railway-url>
```

This will trigger an automatic redeployment.

### 5. Monitor Deployment

1. Go to the "Deployments" tab
2. Watch the build logs for any errors
3. Confirm the deployment succeeds
4. Check that migrations run successfully (see logs for `✓ Admin user created` message)

### 6. Test the Application

1. Visit the Railway URL in a browser
2. Login with:
   - Email: `admin@admin.admin`
   - Password: `Admin1234!`
3. Create a test reminder:
   - Event Name: "Test Email Delivery"
   - Event Date/Time: Set to 2 hours from now
   - Hours Before Start: 6
   - Email Interval: 1
4. Wait for the cron job to run (every 30 minutes)
5. Check email at `traynorthern96@gmail.com` for the reminder
6. Click the acknowledgement link in the email
7. Verify the reminder status updates to "acknowledged" in the dashboard

## Expected Behavior

- **Cron Schedule:** Every 30 minutes (`*/30 * * * *`)
- **Email Send:** Reminders send emails starting 6 hours before the event (or custom hours)
- **Email Frequency:** Every 1 hour (or custom interval) until acknowledged
- **Admin Seeding:** Auto-creates admin user on first production deployment

## Troubleshooting

If deployment fails, check:
1. **Build Logs:** Look for Docker build errors
2. **Database Connection:** Ensure `DATABASE_URL` is properly referenced
3. **Migrations:** Check if `npm run db:migrate` runs successfully in the Dockerfile
4. **Environment Variables:** Verify all required vars are set
5. **Port:** Railway auto-assigns `PORT`, Nuxt should bind to `process.env.PORT || 3000`

## Success Criteria

✅ App deploys successfully on Railway
✅ Public domain is accessible
✅ Can login with admin credentials
✅ Can create reminders in the dashboard
✅ Cron job runs every 30 minutes
✅ Emails are sent to traynorthern96@gmail.com
✅ Acknowledgement links work and update reminder status

## Additional Info

- **Dockerfile:** Multi-stage build with migrations step before server start
- **Build Command:** Handled by Dockerfile
- **Start Command:** `node .output/server/index.mjs` (via Dockerfile CMD)
- **Database:** PostgreSQL provided by Railway
- **Email Service:** External API (already tested and working)
