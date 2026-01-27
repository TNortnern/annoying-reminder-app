import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve } from 'path'

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('✗ DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  console.log('=== Database Migration Starting ===')
  console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'))

  try {
    // Create migration client (max 1 connection for migrations)
    const migrationClient = postgres(connectionString, { max: 1 })
    const db = drizzle(migrationClient)

    const migrationsFolder = resolve('./server/db/migrations')
    console.log('Migrations folder:', migrationsFolder)

    console.log('Running migrations...')
    await migrate(db, { migrationsFolder })

    console.log('✓ Migrations completed successfully')

    await migrationClient.end()
    console.log('=== Database Migration Complete ===')
    process.exit(0)
  } catch (err) {
    console.error('✗ Migration failed:', err)
    process.exit(1)
  }
}

runMigrations()
