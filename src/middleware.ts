import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for every /api route, handled in one place.
 *
 * Students call this API from Vite dev servers (http://localhost:5173, :5174,
 * ...) and from deployed frontends (https://<anything>.vercel.app, Netlify,
 * GitHub Pages, ...). A hardcoded origin list can never keep up, so by default
 * the middleware reflects whatever Origin the browser sends.
 *
 * That is safe for this API because authentication is a Bearer token in the
 * Authorization header, never a cookie. A malicious site cannot piggyback on a
 * logged-in user's session; without the token it is just an anonymous caller.
 *
 * To restrict callers (or if cookie-based auth is ever added), set
 * ALLOWED_ORIGINS as a comma-separated list in the Vercel project settings:
 *   ALLOWED_ORIGINS=https://localheroes-app.vercel.app,http://localhost:5173
 */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowed(origin: string) {
  return ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(req: NextRequest) {
  const headers = new Headers();
  // Responses differ per origin, so any cache must key on it.
  headers.append("Vary", "Origin");

  // curl, Postman and server-to-server calls send no Origin header. CORS does
  // not apply to them, so there is nothing more to add.
  const origin = req.headers.get("origin");
  if (!origin || !isAllowed(origin)) return headers;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  // Echo whatever headers the browser wants to send (Content-Type,
  // Authorization, ...) so a request is never rejected for a missing header.
  headers.set(
    "Access-Control-Allow-Headers",
    req.headers.get("access-control-request-headers") ??
      "Content-Type, Authorization"
  );
  // Let the browser cache the preflight for a day instead of asking each time.
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function middleware(req: NextRequest) {
  const headers = corsHeaders(req);

  // Preflight: answer it here so it never reaches a route handler.
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  // Real request: run the route, then stamp the headers onto its response.
  // This covers 401/404/500 responses too, which is where per-route CORS
  // helpers usually miss.
  return NextResponse.next({ headers });
}

export const config = {
  matcher: "/api/:path*",
};
