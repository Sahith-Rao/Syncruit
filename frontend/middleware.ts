import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const candidateToken = request.cookies.get('candidate_token');
  const adminToken = request.cookies.get('admin_token');
  const path = request.nextUrl.pathname;

  // Candidate routes
  const isCandidateAuthPage = path === '/login' || path === '/register';
  const isCandidateDashboard = path.startsWith('/dashboard');

  // Admin routes
  const isAdminRoute = path.startsWith('/admin');
  const isAdminAuthPage = path === '/admin/login' || path === '/admin/register';
  const isAdminDashboard = path.startsWith('/admin/dashboard');

  // Candidate protection
  if (isCandidateDashboard && !candidateToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isCandidateAuthPage && candidateToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin protection
  if (isAdminRoute && !isAdminAuthPage && !adminToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (isAdminAuthPage && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/admin/:path*'],
}; 