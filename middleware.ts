export { updateSession as middleware } from '@/lib/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/verify-email'],
}