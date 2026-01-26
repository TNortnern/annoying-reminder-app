# Annoying Reminder App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Nuxt 3 full-stack app that sends persistent email reminders until acknowledged via email link.

**Architecture:** Nuxt 3 with server API routes, Drizzle ORM + PostgreSQL, Nitro cron for 30-min scheduled emails, Vue 3 + Nuxt UI for responsive UI (table/cards).

**Tech Stack:** Nuxt 3, Drizzle ORM, PostgreSQL, Nitro Tasks, Nuxt UI, Railway deployment

---

## Task 1: Initialize Nuxt 3 Project

**Files:**
- Create: Project scaffold via `npx nuxi@latest init`
- Modify: `nuxt.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Nuxt 3 project**

```bash
cd /Users/tnorthern/Documents/projects/pers/annoying-reminder-app
npx nuxi@latest init . --package-manager npm
```

Expected: Nuxt project created with default structure

**Step 2: Install Nuxt UI**

```bash
npm install @nuxt/ui
```

**Step 3: Configure Nuxt with Nuxt UI**

Edit `nuxt.config.ts`:

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    // Server-only secrets
    databaseUrl: process.env.DATABASE_URL,
    emailGatewayApiKey: process.env.EMAIL_GATEWAY_API_KEY,
    emailGatewayApiUrl: process.env.EMAIL_GATEWAY_API_URL || 'https://email-gateway-production.up.railway.app/api/v1/emails',
    emailFrom: process.env.EMAIL_FROM || 'Prob <prob@tnorthern.com>',
    emailTo: process.env.EMAIL_TO || 'traynorthern96@gmail.com',
    sessionSecret: process.env.SESSION_SECRET,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@admin.admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin1234!',
    public: {
      // Public app URL for acknowledgement links
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    experimental: {
      tasks: true
    }
  }
})
```

**Step 4: Create environment example file**

Create `.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/reminders
EMAIL_GATEWAY_API_KEY=egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp
EMAIL_GATEWAY_API_URL=https://email-gateway-production.up.railway.app/api/v1/emails
EMAIL_FROM=Prob <prob@tnorthern.com>
EMAIL_TO=traynorthern96@gmail.com
SESSION_SECRET=generate-a-random-secret-here
ADMIN_EMAIL=admin@admin.admin
ADMIN_PASSWORD=Admin1234!
APP_URL=http://localhost:3000
```

**Step 5: Update .gitignore**

Add to `.gitignore`:

```
.env
.env.local
.output
.nuxt
node_modules
dist
.DS_Store
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize Nuxt 3 project with Nuxt UI

- Add Nuxt UI module
- Configure runtime config for env vars
- Enable Nitro experimental tasks for cron
- Add .env.example template

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Set Up Drizzle ORM with PostgreSQL

**Files:**
- Create: `server/db/schema.ts`
- Create: `server/db/index.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json`

**Step 1: Install Drizzle dependencies**

```bash
npm install drizzle-orm postgres bcrypt
npm install -D drizzle-kit @types/bcrypt
```

**Step 2: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```

**Step 3: Create database schema**

Create `server/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const statusEnum = pgEnum('status', ['pending', 'active', 'acknowledged'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventDateTime: timestamp('event_date_time', { withTimezone: true }).notNull(),
  hoursBeforeStart: integer('hours_before_start').notNull().default(6),
  emailIntervalHours: integer('email_interval_hours').notNull().default(1),
  status: statusEnum('status').notNull().default('pending'),
  acknowledgeToken: varchar('acknowledge_token', { length: 64 }).notNull().unique(),
  lastEmailSentAt: timestamp('last_email_sent_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
```

**Step 4: Create database connection**

Create `server/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prepared statements for connection pooling compatibility
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
```

**Step 5: Add migration scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 6: Generate initial migration**

```bash
npm run db:generate
```

Expected: Migration file created in `server/db/migrations/`

**Step 7: Create database seeder as Nitro plugin**

Create `server/plugins/seed.ts`:

```typescript
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export default defineNitroPlugin(async () => {
  // Only run seeding in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.RUN_SEED === 'true') {
    try {
      const config = useRuntimeConfig()
      const adminEmail = config.adminEmail
      const adminPassword = config.adminPassword

      // Check if admin user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1)

      if (!existingUser) {
        // Hash password and create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        await db.insert(users).values({
          email: adminEmail,
          password: hashedPassword
        })

        console.log(`✓ Admin user created: ${adminEmail}`)
      } else {
        console.log(`✓ Admin user already exists: ${adminEmail}`)
      }
    } catch (error) {
      console.error('✗ Failed to seed database:', error)
      // Don't crash the app if seeding fails
    }
  }
})
```

**Step 8: Create local .env file for development**

Create `.env` (not committed):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reminders
EMAIL_GATEWAY_API_KEY=egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp
SESSION_SECRET=dev-secret-change-in-production
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@admin.admin
ADMIN_PASSWORD=Admin1234!
```

**Step 9: Commit**

```bash
git add server/db/ server/plugins/seed.ts drizzle.config.ts package.json package-lock.json
git commit -m "feat: set up Drizzle ORM with PostgreSQL

- Add users and reminders table schema
- Configure Drizzle with migrations support
- Add db scripts for generate/migrate/studio
- Create database connection utility
- Add Nitro plugin to seed admin user on startup
- Install bcrypt for password hashing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Build Authentication System

**Files:**
- Create: `server/utils/auth.ts`
- Create: `server/api/auth/login.post.ts`
- Create: `server/api/auth/logout.post.ts`
- Create: `server/api/auth/session.get.ts`
- Create: `server/middleware/auth.ts`

**Step 1: Install session management**

```bash
npm install h3
```

**Step 2: Create auth utilities**

Create `server/utils/auth.ts`:

```typescript
import { H3Event } from 'h3'
import type { User } from '~/server/db/schema'

const SESSION_NAME = 'reminder_session'

export async function setUserSession(event: H3Event, user: User) {
  await setSession(event, SESSION_NAME, {
    userId: user.id,
    email: user.email,
    timestamp: Date.now()
  })
}

export async function getUserSession(event: H3Event) {
  return await getSession(event, SESSION_NAME)
}

export async function clearUserSession(event: H3Event) {
  await clearSession(event, SESSION_NAME)
}

export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event)

  if (!session?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  return session
}
```

**Step 3: Create login endpoint**

Create `server/api/auth/login.post.ts`:

```typescript
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    // Set session
    await setUserSession(event, user)

    return {
      success: true,
      message: 'Login successful'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw error
  }
})
```

**Step 4: Install zod for validation**

```bash
npm install zod
```

**Step 5: Create logout endpoint**

Create `server/api/auth/logout.post.ts`:

```typescript
export default defineEventHandler(async (event) => {
  await clearUserSession(event)

  return {
    success: true,
    message: 'Logged out successfully'
  }
})
```

**Step 6: Create session check endpoint**

Create `server/api/auth/session.get.ts`:

```typescript
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return {
    authenticated: !!session?.userId,
    user: session ? { id: session.userId, email: session.email } : null
  }
})
```

**Step 7: Create auth middleware for protected routes**

Create `server/middleware/auth.ts`:

```typescript
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Protected API routes
  const protectedPaths = ['/api/reminders']

  // Check if path is protected
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected) {
    await requireAuth(event)
  }
})
```

**Step 8: Commit**

```bash
git add server/utils/auth.ts server/api/auth/ server/middleware/auth.ts package.json package-lock.json
git commit -m "feat: implement authentication system

- Add session-based auth with database users
- Create login/logout/session endpoints
- Hash passwords with bcrypt
- Verify credentials against users table
- Add auth middleware for protected routes
- Use zod for request validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Build Reminders API Endpoints

**Files:**
- Create: `server/api/reminders/index.get.ts`
- Create: `server/api/reminders/index.post.ts`
- Create: `server/api/reminders/[id].patch.ts`
- Create: `server/api/reminders/[id].delete.ts`
- Create: `server/utils/tokens.ts`

**Step 1: Create token generation utility**

Create `server/utils/tokens.ts`:

```typescript
import { randomBytes } from 'crypto'

export function generateAcknowledgeToken(): string {
  return randomBytes(32).toString('hex')
}
```

**Step 2: Create list reminders endpoint**

Create `server/api/reminders/index.get.ts`:

```typescript
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const allReminders = await db
    .select()
    .from(reminders)
    .orderBy(desc(reminders.eventDateTime))

  return {
    reminders: allReminders
  }
})
```

**Step 3: Create reminder creation endpoint**

Create `server/api/reminders/index.post.ts`:

```typescript
import { z } from 'zod'
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'

const createReminderSchema = z.object({
  eventName: z.string().min(1).max(255),
  eventDateTime: z.string().datetime(),
  hoursBeforeStart: z.number().int().min(0).default(6),
  emailIntervalHours: z.number().int().min(1).default(1)
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  try {
    const body = await readBody(event)
    const data = createReminderSchema.parse(body)

    const [reminder] = await db
      .insert(reminders)
      .values({
        eventName: data.eventName,
        eventDateTime: new Date(data.eventDateTime),
        hoursBeforeStart: data.hoursBeforeStart,
        emailIntervalHours: data.emailIntervalHours,
        acknowledgeToken: generateAcknowledgeToken(),
        status: 'pending'
      })
      .returning()

    return {
      reminder
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw error
  }
})
```

**Step 4: Create update reminder endpoint**

Create `server/api/reminders/[id].patch.ts`:

```typescript
import { z } from 'zod'
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

const updateReminderSchema = z.object({
  eventName: z.string().min(1).max(255).optional(),
  eventDateTime: z.string().datetime().optional(),
  hoursBeforeStart: z.number().int().min(0).optional(),
  emailIntervalHours: z.number().int().min(1).optional(),
  status: z.enum(['pending', 'active', 'acknowledged']).optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Reminder ID required'
    })
  }

  try {
    const body = await readBody(event)
    const data = updateReminderSchema.parse(body)

    const updateData: any = {}

    if (data.eventName) updateData.eventName = data.eventName
    if (data.eventDateTime) updateData.eventDateTime = new Date(data.eventDateTime)
    if (data.hoursBeforeStart !== undefined) updateData.hoursBeforeStart = data.hoursBeforeStart
    if (data.emailIntervalHours !== undefined) updateData.emailIntervalHours = data.emailIntervalHours
    if (data.status) updateData.status = data.status

    const [reminder] = await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, id))
      .returning()

    if (!reminder) {
      throw createError({
        statusCode: 404,
        message: 'Reminder not found'
      })
    }

    return {
      reminder
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw error
  }
})
```

**Step 5: Create delete reminder endpoint**

Create `server/api/reminders/[id].delete.ts`:

```typescript
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Reminder ID required'
    })
  }

  const [reminder] = await db
    .delete(reminders)
    .where(eq(reminders.id, id))
    .returning()

  if (!reminder) {
    throw createError({
      statusCode: 404,
      message: 'Reminder not found'
    })
  }

  return {
    success: true,
    message: 'Reminder deleted'
  }
})
```

**Step 6: Commit**

```bash
git add server/api/reminders/ server/utils/tokens.ts
git commit -m "feat: build reminders CRUD API endpoints

- Add list, create, update, delete endpoints
- Generate secure acknowledge tokens
- Validate requests with zod schemas
- Protect all endpoints with auth middleware

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Build Public Acknowledgement Endpoint

**Files:**
- Create: `server/api/acknowledge/[token].get.ts`

**Step 1: Create acknowledgement endpoint**

Create `server/api/acknowledge/[token].get.ts`:

```typescript
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Token required'
    })
  }

  const [reminder] = await db
    .select()
    .from(reminders)
    .where(eq(reminders.acknowledgeToken, token))
    .limit(1)

  if (!reminder) {
    throw createError({
      statusCode: 404,
      message: 'Reminder not found'
    })
  }

  // Already acknowledged
  if (reminder.status === 'acknowledged') {
    return {
      success: true,
      message: 'Reminder already acknowledged',
      reminder
    }
  }

  // Acknowledge the reminder
  const [updated] = await db
    .update(reminders)
    .set({
      status: 'acknowledged',
      acknowledgedAt: new Date()
    })
    .where(eq(reminders.acknowledgeToken, token))
    .returning()

  return {
    success: true,
    message: 'Reminder acknowledged',
    reminder: updated
  }
})
```

**Step 2: Commit**

```bash
git add server/api/acknowledge/
git commit -m "feat: add public acknowledgement endpoint

- Accept acknowledge tokens without auth
- Mark reminders as acknowledged
- Handle already-acknowledged gracefully
- Return reminder details in response

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Build Email Service

**Files:**
- Create: `server/utils/email.ts`

**Step 1: Create email service utility**

Create `server/utils/email.ts`:

```typescript
import type { Reminder } from '~/server/db/schema'

interface EmailPayload {
  to: string
  from: string
  subject: string
  html: string
}

export async function sendReminderEmail(reminder: Reminder) {
  const config = useRuntimeConfig()

  const acknowledgeUrl = `${config.public.appUrl}/acknowledge/${reminder.acknowledgeToken}`

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: ${reminder.eventName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🔔 Reminder</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi there!</p>

        <p style="font-size: 16px;">This is your reminder for:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 20px;">${reminder.eventName}</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">
            <strong>Scheduled for:</strong><br>
            ${new Date(reminder.eventDateTime).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${acknowledgeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ✓ Acknowledge Reminder
          </a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          You'll continue receiving this email every <strong>${reminder.emailIntervalHours} hour(s)</strong> until acknowledged.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>Annoying Reminder App • Made to keep you on track</p>
      </div>
    </body>
    </html>
  `

  const payload: EmailPayload = {
    to: config.emailTo,
    from: config.emailFrom,
    subject: `🔔 Reminder: ${reminder.eventName}`,
    html: emailHtml
  }

  try {
    const response = await $fetch(config.emailGatewayApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.emailGatewayApiKey}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })

    console.log(`✓ Email sent for reminder: ${reminder.eventName}`)
    return { success: true, response }
  } catch (error) {
    console.error(`✗ Failed to send email for reminder: ${reminder.eventName}`, error)
    throw error
  }
}
```

**Step 2: Commit**

```bash
git add server/utils/email.ts
git commit -m "feat: create email service for reminders

- Build HTML email template with gradient styling
- Include acknowledge button with unique link
- Format event datetime for readability
- Integrate with email gateway API
- Add error logging for debugging

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Build Cron Job for Reminder Emails

**Files:**
- Create: `server/tasks/reminder-cron.ts`

**Step 1: Create cron task**

Create `server/tasks/reminder-cron.ts`:

```typescript
import { db } from '~/server/db'
import { reminders } from '~/server/db/schema'
import { eq, and, or, isNull, lte, sql } from 'drizzle-orm'

export default defineTask({
  meta: {
    name: 'reminder-cron',
    description: 'Send reminder emails and activate pending reminders'
  },
  run: async () => {
    console.log('[Cron] Starting reminder check...')
    const now = new Date()

    try {
      // Step 1: Activate pending reminders whose start time has arrived
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

      if (toActivate.length > 0) {
        console.log(`[Cron] Activating ${toActivate.length} reminder(s)`)

        for (const reminder of toActivate) {
          await db
            .update(reminders)
            .set({ status: 'active' })
            .where(eq(reminders.id, reminder.id))

          console.log(`  ✓ Activated: ${reminder.eventName}`)
        }
      }

      // Step 2: Find active reminders that need emails
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

      if (toEmail.length > 0) {
        console.log(`[Cron] Sending ${toEmail.length} reminder email(s)`)

        for (const reminder of toEmail) {
          try {
            await sendReminderEmail(reminder)

            await db
              .update(reminders)
              .set({ lastEmailSentAt: now })
              .where(eq(reminders.id, reminder.id))

            console.log(`  ✓ Sent: ${reminder.eventName}`)
          } catch (error) {
            console.error(`  ✗ Failed to send: ${reminder.eventName}`, error)
            // Continue with other reminders even if one fails
          }
        }
      }

      if (toActivate.length === 0 && toEmail.length === 0) {
        console.log('[Cron] No reminders to process')
      }

      console.log('[Cron] Finished reminder check')

      return {
        result: {
          activated: toActivate.length,
          emailed: toEmail.length,
          timestamp: now.toISOString()
        }
      }
    } catch (error) {
      console.error('[Cron] Error in reminder check:', error)
      throw error
    }
  }
})
```

**Step 2: Configure Nitro to run task every 30 minutes**

Update `nuxt.config.ts` to add task scheduling:

```typescript
export default defineNuxtConfig({
  // ... existing config
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      // Run every 30 minutes
      '*/30 * * * *': ['reminder-cron']
    }
  }
})
```

**Step 3: Commit**

```bash
git add server/tasks/reminder-cron.ts nuxt.config.ts
git commit -m "feat: implement 30-minute cron job for reminders

- Activate pending reminders when start time arrives
- Send emails to active reminders at configured intervals
- Update lastEmailSentAt timestamp after sending
- Handle individual failures gracefully
- Log all cron activity for monitoring

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Build Login Page

**Files:**
- Create: `pages/login.vue`
- Create: `middleware/guest.ts`

**Step 1: Create guest middleware**

Create `middleware/guest.ts`:

```typescript
export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch('/api/auth/session')

  if (data.value?.authenticated) {
    return navigateTo('/dashboard')
  }
})
```

**Step 2: Create login page**

Create `pages/login.vue`:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.success) {
      await navigateTo('/dashboard')
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">🔔 Annoying Reminders</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Login to manage your reminders
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormGroup label="Email" name="email" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@admin.admin"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="Enter password"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid' }"
          @close="error = ''"
        />

        <UButton
          type="submit"
          size="lg"
          block
          :loading="loading"
        >
          Login
        </UButton>
      </form>
    </UCard>
  </div>
</template>
```

**Step 3: Commit**

```bash
git add pages/login.vue middleware/guest.ts
git commit -m "feat: create login page with gradient background

- Add guest middleware to redirect authenticated users
- Build responsive login form with Nuxt UI
- Display error messages for failed login
- Auto-navigate to dashboard on success

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Build Dashboard Page with Reminders List

**Files:**
- Create: `pages/index.vue`
- Create: `pages/dashboard.vue`
- Create: `middleware/auth.ts`
- Create: `components/ReminderCard.vue`
- Create: `components/ReminderTable.vue`

**Step 1: Redirect index to dashboard**

Create `pages/index.vue`:

```vue
<script setup lang="ts">
await navigateTo('/dashboard')
</script>

<template>
  <div />
</template>
```

**Step 2: Create auth middleware**

Create `middleware/auth.ts`:

```typescript
export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch('/api/auth/session')

  if (!data.value?.authenticated) {
    return navigateTo('/login')
  }
})
```

**Step 3: Create reminder card component**

Create `components/ReminderCard.vue`:

```vue
<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  reminder: Reminder
}>()

const emit = defineEmits<{
  edit: [reminder: Reminder]
  delete: [id: string]
  acknowledge: [id: string]
}>()

const statusColor = computed(() => {
  switch (props.reminder.status) {
    case 'pending': return 'gray'
    case 'active': return 'orange'
    case 'acknowledged': return 'green'
    default: return 'gray'
  }
})

const formattedDate = computed(() => {
  return new Date(props.reminder.eventDateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})
</script>

<template>
  <UCard>
    <div class="space-y-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold truncate">
            {{ reminder.eventName }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ formattedDate }}
          </p>
        </div>
        <UBadge :color="statusColor" variant="soft" size="lg">
          {{ reminder.status }}
        </UBadge>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>📧 Every {{ reminder.emailIntervalHours }}h</p>
        <p>⏰ Starts {{ reminder.hoursBeforeStart }}h before</p>
      </div>

      <div class="flex gap-2 pt-2">
        <UButton
          size="sm"
          color="gray"
          variant="soft"
          @click="emit('edit', reminder)"
        >
          Edit
        </UButton>
        <UButton
          v-if="reminder.status !== 'acknowledged'"
          size="sm"
          color="green"
          variant="soft"
          @click="emit('acknowledge', reminder.id)"
        >
          Acknowledge
        </UButton>
        <UButton
          size="sm"
          color="red"
          variant="soft"
          @click="emit('delete', reminder.id)"
        >
          Delete
        </UButton>
      </div>
    </div>
  </UCard>
</template>
```

**Step 4: Create reminder table component**

Create `components/ReminderTable.vue`:

```vue
<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  reminders: Reminder[]
}>()

const emit = defineEmits<{
  edit: [reminder: Reminder]
  delete: [id: string]
  acknowledge: [id: string]
}>()

const columns = [
  { key: 'eventName', label: 'Event' },
  { key: 'eventDateTime', label: 'Date & Time' },
  { key: 'status', label: 'Status' },
  { key: 'config', label: 'Configuration' },
  { key: 'actions', label: 'Actions' }
]

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function statusColor(status: string) {
  switch (status) {
    case 'pending': return 'gray'
    case 'active': return 'orange'
    case 'acknowledged': return 'green'
    default: return 'gray'
  }
}
</script>

<template>
  <UTable :columns="columns" :rows="reminders">
    <template #eventName-data="{ row }">
      <span class="font-medium">{{ row.eventName }}</span>
    </template>

    <template #eventDateTime-data="{ row }">
      <span class="text-sm">{{ formatDate(row.eventDateTime) }}</span>
    </template>

    <template #status-data="{ row }">
      <UBadge :color="statusColor(row.status)" variant="soft">
        {{ row.status }}
      </UBadge>
    </template>

    <template #config-data="{ row }">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <div>Every {{ row.emailIntervalHours }}h</div>
        <div>{{ row.hoursBeforeStart }}h before</div>
      </div>
    </template>

    <template #actions-data="{ row }">
      <div class="flex gap-2">
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          @click="emit('edit', row)"
        >
          Edit
        </UButton>
        <UButton
          v-if="row.status !== 'acknowledged'"
          size="xs"
          color="green"
          variant="soft"
          @click="emit('acknowledge', row.id)"
        >
          ✓
        </UButton>
        <UButton
          size="xs"
          color="red"
          variant="soft"
          @click="emit('delete', row.id)"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UTable>
</template>
```

**Step 5: Create dashboard page**

Create `pages/dashboard.vue`:

```vue
<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

definePageMeta({
  middleware: 'auth'
})

const { data: remindersData, refresh } = await useFetch('/api/reminders')

const reminders = computed(() => remindersData.value?.reminders || [])

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this reminder?')) {
    await $fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    await refresh()
  }
}

async function handleAcknowledge(id: string) {
  await $fetch(`/api/reminders/${id}`, {
    method: 'PATCH',
    body: { status: 'acknowledged' }
  })
  await refresh()
}

function handleEdit(reminder: Reminder) {
  // TODO: Open edit modal (Task 10)
  console.log('Edit:', reminder)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">🔔 Annoying Reminders</h1>
          <UButton
            color="gray"
            variant="soft"
            @click="handleLogout"
          >
            Logout
          </UButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <UButton
          size="lg"
          @click="() => {}"
        >
          + Create Reminder
        </UButton>
      </div>

      <div v-if="reminders.length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 text-lg">
          No reminders yet. Create one to get started!
        </p>
      </div>

      <div v-else>
        <!-- Desktop: Table -->
        <div class="hidden lg:block">
          <ReminderTable
            :reminders="reminders"
            @edit="handleEdit"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>

        <!-- Mobile: Cards -->
        <div class="lg:hidden grid gap-4">
          <ReminderCard
            v-for="reminder in reminders"
            :key="reminder.id"
            :reminder="reminder"
            @edit="handleEdit"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>
      </div>
    </main>
  </div>
</template>
```

**Step 6: Commit**

```bash
git add pages/ middleware/auth.ts components/
git commit -m "feat: build dashboard with responsive reminders list

- Create auth middleware for protected pages
- Build table view for desktop
- Build card view for mobile
- Add edit/delete/acknowledge actions
- Display status badges with colors
- Show empty state for no reminders

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Build Reminder Form Modal

**Files:**
- Create: `components/ReminderFormModal.vue`
- Modify: `pages/dashboard.vue`

**Step 1: Create reminder form modal component**

Create `components/ReminderFormModal.vue`:

```vue
<script setup lang="ts">
import { z } from 'zod'
import type { Reminder } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
  reminder?: Reminder | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const isEdit = computed(() => !!props.reminder)

const form = reactive({
  eventName: '',
  eventDateTime: '',
  hoursBeforeStart: 6,
  emailIntervalHours: 1
})

const loading = ref(false)
const error = ref('')

// Populate form when editing
watch(() => props.reminder, (reminder) => {
  if (reminder) {
    form.eventName = reminder.eventName
    form.eventDateTime = new Date(reminder.eventDateTime).toISOString().slice(0, 16)
    form.hoursBeforeStart = reminder.hoursBeforeStart
    form.emailIntervalHours = reminder.emailIntervalHours
  }
}, { immediate: true })

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen && !props.reminder) {
    form.eventName = ''
    form.eventDateTime = ''
    form.hoursBeforeStart = 6
    form.emailIntervalHours = 1
    error.value = ''
  }
})

const intervalOptions = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' }
]

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    // Validate datetime is in future
    const eventDate = new Date(form.eventDateTime)
    if (eventDate <= new Date()) {
      error.value = 'Event must be in the future'
      loading.value = false
      return
    }

    const body = {
      eventName: form.eventName,
      eventDateTime: eventDate.toISOString(),
      hoursBeforeStart: form.hoursBeforeStart,
      emailIntervalHours: form.emailIntervalHours
    }

    if (isEdit.value && props.reminder) {
      await $fetch(`/api/reminders/${props.reminder.id}`, {
        method: 'PATCH',
        body
      })
    } else {
      await $fetch('/api/reminders', {
        method: 'POST',
        body
      })
    }

    emit('success')
    emit('close')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to save reminder'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal :model-value="isOpen" @update:model-value="emit('close')">
    <UCard>
      <template #header>
        <h3 class="text-xl font-bold">
          {{ isEdit ? 'Edit Reminder' : 'Create Reminder' }}
        </h3>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormGroup label="Event Name" name="eventName" required>
          <UInput
            v-model="form.eventName"
            placeholder="Doctor appointment"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Event Date & Time" name="eventDateTime" required>
          <UInput
            v-model="form.eventDateTime"
            type="datetime-local"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup
          label="Hours Before Event"
          name="hoursBeforeStart"
          help="When should reminders start?"
        >
          <UInput
            v-model.number="form.hoursBeforeStart"
            type="number"
            :min="0"
            :max="168"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup
          label="Email Interval"
          name="emailIntervalHours"
          help="How often should we send reminders?"
        >
          <USelectMenu
            v-model="form.emailIntervalHours"
            :options="intervalOptions"
            option-attribute="label"
            value-attribute="value"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
        />

        <div class="flex gap-3">
          <UButton
            type="submit"
            size="lg"
            :loading="loading"
            class="flex-1"
          >
            {{ isEdit ? 'Update' : 'Create' }}
          </UButton>
          <UButton
            type="button"
            color="gray"
            variant="soft"
            size="lg"
            @click="emit('close')"
            :disabled="loading"
          >
            Cancel
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>
```

**Step 2: Update dashboard to use modal**

Update `pages/dashboard.vue`:

```vue
<script setup lang="ts">
import type { Reminder } from '~/server/db/schema'

definePageMeta({
  middleware: 'auth'
})

const { data: remindersData, refresh } = await useFetch('/api/reminders')

const reminders = computed(() => remindersData.value?.reminders || [])

const isModalOpen = ref(false)
const editingReminder = ref<Reminder | null>(null)

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

function openCreateModal() {
  editingReminder.value = null
  isModalOpen.value = true
}

function openEditModal(reminder: Reminder) {
  editingReminder.value = reminder
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingReminder.value = null
}

async function handleSuccess() {
  await refresh()
}

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this reminder?')) {
    await $fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    await refresh()
  }
}

async function handleAcknowledge(id: string) {
  await $fetch(`/api/reminders/${id}`, {
    method: 'PATCH',
    body: { status: 'acknowledged' }
  })
  await refresh()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">🔔 Annoying Reminders</h1>
          <UButton
            color="gray"
            variant="soft"
            @click="handleLogout"
          >
            Logout
          </UButton>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <UButton
          size="lg"
          @click="openCreateModal"
        >
          + Create Reminder
        </UButton>
      </div>

      <div v-if="reminders.length === 0" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 text-lg">
          No reminders yet. Create one to get started!
        </p>
      </div>

      <div v-else>
        <!-- Desktop: Table -->
        <div class="hidden lg:block">
          <ReminderTable
            :reminders="reminders"
            @edit="openEditModal"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>

        <!-- Mobile: Cards -->
        <div class="lg:hidden grid gap-4">
          <ReminderCard
            v-for="reminder in reminders"
            :key="reminder.id"
            :reminder="reminder"
            @edit="openEditModal"
            @delete="handleDelete"
            @acknowledge="handleAcknowledge"
          />
        </div>
      </div>
    </main>

    <ReminderFormModal
      :is-open="isModalOpen"
      :reminder="editingReminder"
      @close="closeModal"
      @success="handleSuccess"
    />
  </div>
</template>
```

**Step 3: Commit**

```bash
git add components/ReminderFormModal.vue pages/dashboard.vue
git commit -m "feat: add reminder create/edit modal

- Build form modal with validation
- Support both create and edit modes
- Add datetime picker and interval selector
- Validate event is in future
- Auto-populate form when editing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Build Acknowledgement Success Page

**Files:**
- Create: `pages/acknowledge/[token].vue`

**Step 1: Create acknowledgement page**

Create `pages/acknowledge/[token].vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const token = route.params.token as string

const { data, error } = await useFetch(`/api/acknowledge/${token}`)

const reminder = computed(() => data.value?.reminder)
const success = computed(() => data.value?.success)
const alreadyAcknowledged = computed(() =>
  data.value?.message?.includes('already acknowledged')
)

const formattedDate = computed(() => {
  if (!reminder.value) return ''
  return new Date(reminder.value.eventDateTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
    <UCard class="w-full max-w-md">
      <div v-if="error" class="text-center space-y-4">
        <div class="text-6xl">❌</div>
        <h1 class="text-2xl font-bold text-red-600 dark:text-red-400">
          Invalid Token
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          This acknowledgement link is invalid or has expired.
        </p>
      </div>

      <div v-else-if="success" class="text-center space-y-4">
        <div class="text-6xl">
          {{ alreadyAcknowledged ? '✅' : '🎉' }}
        </div>
        <h1 class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ alreadyAcknowledged ? 'Already Acknowledged' : 'Reminder Acknowledged!' }}
        </h1>

        <div v-if="reminder" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left">
          <h2 class="font-semibold text-lg mb-2">{{ reminder.eventName }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ formattedDate }}
          </p>
        </div>

        <p class="text-gray-600 dark:text-gray-400">
          {{ alreadyAcknowledged
            ? 'This reminder was already acknowledged. You won\'t receive any more emails.'
            : 'You won\'t receive any more reminder emails for this event.'
          }}
        </p>

        <UButton
          to="/dashboard"
          size="lg"
          block
        >
          View All Reminders
        </UButton>
      </div>
    </UCard>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add pages/acknowledge/
git commit -m "feat: create acknowledgement success page

- Display success message with confetti emoji
- Show acknowledged reminder details
- Handle invalid tokens gracefully
- Show special message for already-acknowledged
- Link back to dashboard

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Create Dockerfile for Railway Deployment

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Nuxt application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/db/migrations ./server/db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Start application (run migrations first, seeding handled by Nitro plugin)
CMD ["sh", "-c", "npm run db:migrate && node .output/server/index.mjs"]
```

**Step 2: Create .dockerignore**

Create `.dockerignore`:

```
.nuxt
.output
node_modules
.git
.env
.env.*
!.env.example
dist
.DS_Store
*.log
```

**Step 3: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile for Railway deployment

- Multi-stage build for optimized image size
- Run migrations before starting server
- Copy migrations folder for production
- Expose port 3000 for Railway
- Set NODE_ENV to production

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Deploy to Railway

**Files:**
- Create: `railway.json` (optional config)

**Step 1: Create GitHub repository**

```bash
gh repo create annoying-reminder-app --public --source=. --remote=origin --push
```

Expected: Repository created and code pushed

**Step 2: Create Railway project with PostgreSQL**

Use @superpowers:using-railway skill to:
1. Create new Railway project
2. Add PostgreSQL database
3. Link GitHub repo
4. Configure environment variables
5. Deploy

**Environment Variables to Set in Railway:**
```
DATABASE_URL=${DATABASE_URL}  # Auto-set by PostgreSQL plugin
EMAIL_GATEWAY_API_KEY=egw_live_lMJ2Z_ncCTetk-UV4n7ruIht4AcSwoKp
EMAIL_GATEWAY_API_URL=https://email-gateway-production.up.railway.app/api/v1/emails
EMAIL_FROM=Prob <prob@tnorthern.com>
EMAIL_TO=traynorthern96@gmail.com
SESSION_SECRET=<generate-random-32-char-string>
ADMIN_EMAIL=admin@admin.admin
ADMIN_PASSWORD=Admin1234!
APP_URL=https://<your-railway-domain>.up.railway.app
```

**Step 3: Verify deployment**

Once deployed:
1. Visit Railway URL
2. Login with admin credentials
3. Create a test reminder
4. Check Railway logs for cron job execution

**Step 4: Commit Railway config if created**

```bash
git add railway.json
git commit -m "chore: add Railway deployment config

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push
```

---

## Task 14: Test End-to-End Flow

**Test Checklist:**

1. **Authentication**
   - [ ] Login with correct credentials
   - [ ] Login fails with wrong credentials
   - [ ] Redirect to dashboard after login
   - [ ] Logout clears session
   - [ ] Protected routes redirect to login

2. **Create Reminder**
   - [ ] Create reminder with default values
   - [ ] Create reminder with custom interval
   - [ ] Validation: event must be in future
   - [ ] Reminder appears in list after creation

3. **Reminder List**
   - [ ] Reminders sorted by date
   - [ ] Status badges show correct colors
   - [ ] Desktop shows table view
   - [ ] Mobile shows card view

4. **Edit Reminder**
   - [ ] Edit modal opens with pre-filled data
   - [ ] Update saves correctly
   - [ ] Changes reflected in list

5. **Delete Reminder**
   - [ ] Confirmation dialog appears
   - [ ] Reminder deleted from database
   - [ ] List updates after deletion

6. **Manual Acknowledge**
   - [ ] Acknowledge button works
   - [ ] Status changes to 'acknowledged'
   - [ ] Button disappears after acknowledge

7. **Cron Job**
   - [ ] Creates reminder 1 hour before event
   - [ ] Status changes from 'pending' to 'active'
   - [ ] Email sent successfully
   - [ ] Check Railway logs for cron activity

8. **Email Acknowledgement**
   - [ ] Receive email with reminder details
   - [ ] Click acknowledge link
   - [ ] Success page shows
   - [ ] Status updated in database
   - [ ] No more emails sent

9. **Edge Cases**
   - [ ] Invalid acknowledge token shows error
   - [ ] Already acknowledged shows special message
   - [ ] Empty reminder list shows empty state
   - [ ] Long event names truncate properly

**Step: Run through test checklist**

Manually test each item in production Railway environment.

**Step: Fix any bugs found**

Create commits for any fixes needed.

---

## Success Criteria

✅ Nuxt 3 app with Nuxt UI styling
✅ Drizzle ORM with PostgreSQL
✅ Session-based authentication
✅ CRUD operations for reminders
✅ Responsive UI (table + cards)
✅ 30-minute cron job for emails
✅ Email integration with gateway API
✅ Public acknowledgement endpoint
✅ Railway deployment with auto-migrations
✅ End-to-end flow tested

---

## Future Enhancements (Out of Scope)

- Multiple users with user management
- SMS reminders via Twilio
- Recurring events (daily, weekly, monthly)
- Snooze functionality
- Categories and tags for reminders
- Email template customization
- Mobile app (React Native)
- Push notifications
- Calendar import/export (iCal)
- Webhook integrations

---

**Implementation Notes:**

- Follow DRY principles: Don't repeat database queries, validation logic, or UI patterns
- YAGNI: Build only what's in the spec, no extra features
- Commit frequently with descriptive messages
- Test each component before moving to next task
- Use Nuxt UI components consistently for design cohesion
- Keep cron job lightweight (< 30 sec execution time)
- Log all email sending for debugging in production

