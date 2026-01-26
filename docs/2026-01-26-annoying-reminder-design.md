# Annoying Reminder App - Design Document

**Date:** January 26, 2026
**Purpose:** Event reminder system with persistent email notifications until acknowledgement

## Overview

A micro calendar app that sends increasingly annoying email reminders for events until the user acknowledges them. Built for single-user use with hardcoded authentication.

## Requirements

- Create events with date/time
- Configure when reminders start (hours before event)
- Configure email frequency (default: every 1 hour)
- Send persistent emails until acknowledged
- One-click acknowledgement via email link
- Simple responsive UI (table on desktop, cards on mobile)

## Tech Stack

**Framework:** Nuxt 3 Full-Stack
- Frontend: Vue 3 + Nuxt UI for styling
- Backend: Nitro server with API routes
- Database: PostgreSQL via Drizzle ORM
- Cron: Nitro scheduled tasks (every 30 minutes)
- Email: Email Gateway API at `email-gateway-production.up.railway.app`

**Deployment:**
- Railway (Hobby plan)
- Single service: Nuxt app + PostgreSQL database
- GitHub repo linked for auto-deploys
- Drizzle migrations run on deploy

**Authentication:**
- Hardcoded credentials: `admin@admin.admin` / `Admin1234!`
- Session-based auth (no OAuth)
- Public acknowledgement endpoint (no auth required)

## Architecture

```
annoying-reminder-app/
├── docs/                           # Design & planning docs
├── server/
│   ├── api/                       # API endpoints
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   └── logout.post.ts
│   │   ├── reminders/
│   │   │   ├── index.get.ts      # List all
│   │   │   ├── index.post.ts     # Create
│   │   │   ├── [id].patch.ts     # Update
│   │   │   └── [id].delete.ts    # Delete
│   │   └── acknowledge/
│   │       └── [token].get.ts    # Public acknowledgement
│   ├── tasks/
│   │   └── reminder-cron.ts      # 30-min scheduled task
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── index.ts              # DB connection
│   │   └── migrations/           # Auto-generated migrations
│   ├── utils/
│   │   ├── email.ts              # Email sender
│   │   └── auth.ts               # Auth helpers
│   └── middleware/
│       └── auth.ts               # Protected route middleware
├── pages/
│   ├── login.vue                 # Login page
│   ├── dashboard.vue             # Main reminders list
│   └── acknowledge/
│       └── [token].vue           # Acknowledgement success page
├── components/
│   ├── ReminderCard.vue          # Mobile card view
│   ├── ReminderTable.vue         # Desktop table view
│   └── ReminderForm.vue          # Create/edit form
├── Dockerfile                     # Railway deployment
├── drizzle.config.ts             # Drizzle configuration
└── nuxt.config.ts                # Nuxt configuration
```

## Database Schema

**Reminders Table:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | Primary key |
| eventName | varchar(255) | Required |
| eventDateTime | timestamp | Required |
| hoursBeforeStart | integer | Default: 6 |
| emailIntervalHours | integer | Default: 1 |
| status | enum | 'pending', 'active', 'acknowledged' |
| acknowledgeToken | varchar(64) | Unique, generated on create |
| lastEmailSentAt | timestamp | Nullable |
| acknowledgedAt | timestamp | Nullable |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

**Status Flow:**
1. `pending` - Created, waiting for start time
2. `active` - Sending emails every X hours
3. `acknowledged` - User clicked link, stop sending

**Indexes:**
- `acknowledgeToken` (unique)
- `status` (for cron queries)
- `eventDateTime` (for sorting)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with hardcoded credentials
  - Body: `{ email, password }`
  - Returns: `{ success: true }` and sets session cookie

- `POST /api/auth/logout` - Clear session
  - Returns: `{ success: true }`

### Reminders (Protected)
- `GET /api/reminders` - List all reminders
  - Returns: `{ reminders: [...] }` sorted by eventDateTime

- `POST /api/reminders` - Create reminder
  - Body: `{ eventName, eventDateTime, hoursBeforeStart?, emailIntervalHours? }`
  - Generates `acknowledgeToken` (crypto.randomBytes)
  - Returns: `{ reminder: {...} }`

- `PATCH /api/reminders/:id` - Update reminder
  - Body: Any editable fields
  - Returns: `{ reminder: {...} }`

- `DELETE /api/reminders/:id` - Delete reminder
  - Returns: `{ success: true }`

### Acknowledgement (Public)
- `GET /api/acknowledge/:token` - Acknowledge reminder
  - Finds reminder by token
  - Sets status to 'acknowledged', acknowledgedAt to now
  - Redirects to `/acknowledge/:token` page
  - Returns: `{ success: true, reminder: {...} }`

## Cron Job Logic

**Schedule:** Every 30 minutes via Nitro tasks

**Process:**

1. **Activate Pending Reminders**
   ```typescript
   const now = new Date()
   const toActivate = await db
     .select()
     .from(reminders)
     .where(
       and(
         eq(reminders.status, 'pending'),
         lte(
           sql`${reminders.eventDateTime} - (${reminders.hoursBeforeStart} * interval '1 hour')`,
           now
         )
       )
     )

   // Set status to 'active' for each
   ```

2. **Send Reminder Emails**
   ```typescript
   const toEmail = await db
     .select()
     .from(reminders)
     .where(
       and(
         eq(reminders.status, 'active'),
         or(
           isNull(reminders.lastEmailSentAt),
           lte(
             sql`${reminders.lastEmailSentAt} + (${reminders.emailIntervalHours} * interval '1 hour')`,
             now
           )
         )
       )
     )

   // Send email for each
   // Update lastEmailSentAt
   ```

3. **Error Handling**
   - Log failures but don't crash
   - Retry on next run (30 min later)

## Email Configuration

**Email Gateway API:**
- Endpoint: `https://email-gateway-production.up.railway.app/api/v1/emails`
- API Key: `egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp`
- From: `Prob <prob@tnorthern.com>`
- To: `traynorthern96@gmail.com` (hardcoded)

**Email Template:**
```
Subject: 🔔 Reminder: {eventName}

Hi!

This is your reminder for:
{eventName}
Scheduled for: {eventDateTime formatted}

Click below to acknowledge this reminder:
[Big Button: Acknowledge Reminder]
(Links to: https://your-app.com/acknowledge/{token})

You'll continue receiving this email every {emailIntervalHours} hour(s) until acknowledged.
```

**HTML Email:**
- Responsive design
- Large acknowledge button (call-to-action)
- Clear event details
- Professional but friendly tone

## UI Components

### Login Page (`/login`)
- Simple centered form
- Email and password fields
- "Login" button
- Error message display
- Redirects to `/dashboard` on success

### Dashboard Page (`/dashboard`)
- Header with "Annoying Reminders" title + logout button
- "Create Reminder" button (opens modal)
- Reminders list:
  - **Desktop:** Table with columns (Event Name, Date/Time, Status, Actions)
  - **Mobile:** Cards with same info
- Status badges:
  - Pending (gray)
  - Active (yellow/orange - pulsing)
  - Acknowledged (green with checkmark)
- Actions: Edit, Delete, Manual Acknowledge
- Empty state: "No reminders yet. Create one to get started!"

### Reminder Form (Modal)
- Event name (text input)
- Event date & time (datetime-local input)
- Hours before start (number input, default: 6)
- Email interval (select: 1hr, 2hr, 4hr, 6hr, 12hr)
- Save/Cancel buttons
- Validation: All fields required, eventDateTime must be future

### Acknowledge Page (`/acknowledge/:token`)
- Success message: "✅ Reminder Acknowledged!"
- Show event details
- "View All Reminders" button (to dashboard)
- Handles invalid tokens gracefully

## Deployment Strategy

**Docker Setup:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "db:migrate", "&&", "node", ".output/server/index.mjs"]
```

**Railway Configuration:**
- Service: Nuxt App (connected to GitHub)
- Database: PostgreSQL plugin
- Environment Variables:
  - `DATABASE_URL` (from PostgreSQL plugin)
  - `EMAIL_GATEWAY_API_KEY`
  - `EMAIL_GATEWAY_API_URL`
  - `EMAIL_FROM`
  - `EMAIL_TO`
  - `SESSION_SECRET` (random string)
  - `ADMIN_EMAIL` (admin@admin.admin)
  - `ADMIN_PASSWORD` (Admin1234!)
  - `APP_URL` (Railway-provided URL)

**Migration Strategy:**
- Migrations generated via `drizzle-kit generate`
- Run on deploy via package.json script: `"db:migrate": "drizzle-kit migrate"`
- Safe concurrent deploys (Drizzle handles locking)

## Security Considerations

- Session secret must be strong random string
- Acknowledge tokens: 32 bytes random (crypto.randomBytes)
- Rate limiting on login endpoint (prevent brute force)
- CORS configured for Railway domain only
- SQL injection prevented by Drizzle parameterized queries
- XSS prevented by Vue's default escaping

## Error Handling

**API Errors:**
- 400: Validation errors
- 401: Unauthorized
- 404: Not found
- 500: Internal server error
- Consistent JSON format: `{ error: string, details?: any }`

**Cron Errors:**
- Log to console/Railway logs
- Don't crash process
- Continue with next reminder on individual failures

**Email Failures:**
- Log error
- Don't mark as sent (will retry on next cron run)
- Consider dead letter queue for persistent failures (future enhancement)

## Future Enhancements (Out of Scope)

- Multiple users
- SMS reminders
- Recurring events
- Snooze functionality
- Reminder categories/tags
- Mobile app
- Browser notifications
- Email templates customization

## Success Criteria

✅ Can create event reminders with custom timing
✅ Emails sent persistently until acknowledged
✅ One-click acknowledgement from email
✅ Responsive UI (desktop table, mobile cards)
✅ Deploys to Railway successfully
✅ Cron job runs reliably every 30 minutes
✅ Simple authentication with hardcoded credentials

---

**Next Steps:**
1. Initialize Nuxt 3 project
2. Set up Drizzle + PostgreSQL
3. Implement database schema + migrations
4. Build API endpoints
5. Create UI components
6. Implement cron job
7. Configure Railway deployment
8. Test end-to-end flow
