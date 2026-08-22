import { next, rewrite } from '@vercel/functions';
import { handleProtectedRequest } from './lib/protected-middleware.mjs';

export const config = {
  matcher: ['/:path*'],
};

export default function middleware(request: Request) {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return handleProtectedRequest(request, {
    sessionSecret: runtime.process?.env?.WXO_SESSION_SECRET,
    next,
    rewrite,
  });
}
