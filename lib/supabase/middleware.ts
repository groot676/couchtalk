import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected routes
const protectedRoutes = ['/chat', '/profile', '/settings', '/mode-select', '/couple']

export async function updateSession(request: NextRequest) {
  // Create response first
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This will refresh the session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Define routes
  const isSignInPage = request.nextUrl.pathname === '/signin'
  const isSignUpPage = request.nextUrl.pathname === '/signup'
  const isHomePage = request.nextUrl.pathname === '/'
  const isChatPage = request.nextUrl.pathname === '/chat'
  const isAuthPage = isSignInPage || isSignUpPage

  // Only redirect if necessary
  if (!user && isChatPage) {
    // Not logged in, trying to access chat
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (user && isAuthPage) {
    // Logged in, trying to access auth pages
    return NextResponse.redirect(new URL('/mode-select', request.url))
  }

  return response
}