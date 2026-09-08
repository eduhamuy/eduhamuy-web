import { handlers } from "@/auth";
import { isAuthEnabled } from "@/lib/auth-enabled";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  if (!isAuthEnabled()) return new Response(null, { status: 404 });
  return handlers.GET(request);
}

export function POST(request: NextRequest) {
  if (!isAuthEnabled()) return new Response(null, { status: 404 });
  return handlers.POST(request);
}
