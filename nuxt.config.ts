export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    emailGatewayApiKey: process.env.EMAIL_GATEWAY_API_KEY,
    emailGatewayApiUrl: process.env.EMAIL_GATEWAY_API_URL || 'https://email-gateway-production.up.railway.app/api/v1/emails',
    emailFrom: process.env.EMAIL_FROM || 'Prob <prob@tnorthern.com>',
    emailTo: process.env.EMAIL_TO || 'traynorthern96@gmail.com',
    sessionSecret: process.env.SESSION_SECRET,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@admin.admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin1234!',
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '*/30 * * * *': ['reminder-cron']
    }
  }
})
