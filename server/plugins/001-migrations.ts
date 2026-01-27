import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default defineNitroPlugin(async (nitroApp) => {
  console.log('=== PRISMA MIGRATION PLUGIN STARTING ===')

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('✗ DATABASE_URL environment variable is not set')
    throw new Error('DATABASE_URL is required')
  }

  console.log('Connection string configured:', connectionString.replace(/:[^:@]+@/, ':****@'))

  try {
    console.log('Running Prisma migrations...')
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy')

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    console.log('✓ Prisma migrations completed successfully')
    console.log('=== PRISMA MIGRATION PLUGIN COMPLETE ===')
  } catch (err: any) {
    console.error('✗ Prisma migration failed:', err.message)
    if (err.stdout) console.error('stdout:', err.stdout)
    if (err.stderr) console.error('stderr:', err.stderr)
    throw err
  }
})
