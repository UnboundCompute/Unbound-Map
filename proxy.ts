import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.get('bundle')) return NextResponse.next();
  const home = request.nextUrl.clone();
  home.pathname = '/';
  home.search = '';
  return NextResponse.redirect(home);
}

export const config = {
  matcher: ['/architecture/:path*', '/flows/:path*', '/flow/:path*', '/trust/:path*', '/explore/:path*', '/embed/:path*', '/map/:path*'],
};
