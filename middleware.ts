import { next, rewrite } from '@vercel/functions';
import { handleProtectedRequest } from './lib/protected-middleware.mjs';

export const config = {
  matcher: [
    '/wxo-canvas',
    '/wxo-canvas.html',
    '/document-processing',
    '/document-processing.html',
    '/protected/wxo/:path*',
  ],
};

export default function middleware(request: Request) {
  return handleProtectedRequest(request, {
    sessionSecret: process.env.WXO_SESSION_SECRET,
    next,
    rewrite,
  });
}
