/**
 * Smart backend URL detection utility
 * Works for both local development and cloud deployment:
 * - Local: uses relative URLs via Next.js proxy
 * - Cloud: uses NEXT_PUBLIC_API_URL env var
 */

/**
 * Get the backend URL for HTTP API calls
 * In browser: uses relative URL '/api' (proxied by Next.js rewrites)
 * On server: uses BACKEND_URL env var
 */
export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser: use relative URL, Next.js will proxy it
    return '/api';
  }
  // Server-side: use environment variable
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Get the backend URL for WebSocket connections
 * WebSockets need the full URL (can't use Next.js proxy)
 */
export function getBackendSocketUrl(): string {
  // NEXT_PUBLIC_ vars are available in the browser bundle
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // In browser, detect from current page location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:3001`;
    }
    // Deployed: assume backend is on a different host — needs NEXT_PUBLIC_API_URL
    // Fallback: same origin (won't work for cross-origin, but better than nothing)
    return window.location.origin;
  }

  return 'http://localhost:3001';
}

