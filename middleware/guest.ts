export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch('/api/auth/session')

  if (data.value?.authenticated) {
    return navigateTo('/dashboard')
  }
})
