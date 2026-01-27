import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve } from 'path'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('=== MIGRATION PLUGIN STARTING ===')

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('✗ DATABASE_URL environment variable is not set')
    throw new Error('DATABASE_URL is required')
  }

  console.log('Connection string configured:', connectionString.replace(/:[^:@]+@/, ':****@'))

  try {
    // Create migration client
    const migrationClient = postgres(connectionString, { max: 1 })
    const db = drizzle(migrationClient)

    const migrationsFolder = resolve(process.cwd(), './server/db/migrations')
    console.log('Migrations folder:', migrationsFolder)
    console.log('Current working directory:', process.cwd())

    // List files in migrations folder
    console.log('Checking migrations folder...')

    console.log('Running migrations...')
    await migrate(db, { migrationsFolder })

    console.log('✓ Migrations completed successfully')

    await migrationClient.end()
    console.log('=== MIGRATION PLUGIN COMPLETE ===')
  } catch (err) {
    console.error('✗ Migration failed:', err)
    throw err
  }
})
