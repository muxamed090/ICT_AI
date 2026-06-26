import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const url = request.nextUrl.clone()
  const path = url.pathname

  // Identify public vs auth page
  const isAuthPage = path === '/login' || path === '/register'
  const isPublicPage = 
    isAuthPage || 
    path === '/' || 
    path === '/forgot-password' || 
    path === '/reset-password' || 
    path === '/email-verification' ||
    path.startsWith('/api/auth')

  if (user) {
    if (isAuthPage) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } else {
    if (!isPublicPage) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - all images/assets matching standard extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
