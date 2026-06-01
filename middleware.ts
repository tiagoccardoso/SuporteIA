import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/api/health"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname.startsWith(path)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }
  const session = request.cookies.get("supportai_session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!.*\\..*).*)"] };
