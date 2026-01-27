import { defineDatabaseConfig } from '@prisma/client/runtime/config-environment'

export default defineDatabaseConfig({
  url: process.env.DATABASE_URL!
})
