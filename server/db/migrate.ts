import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL!

  // Create migration client (max 1 connection for migrations)
  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: './server/db/migrations' })

  console.log('✓ Migrations completed successfully')

  await migrationClient.end()
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('✗ Migration failed:', err)
  process.exit(1)
})
