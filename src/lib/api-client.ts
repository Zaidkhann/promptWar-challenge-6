/**
 * Resolves the full URL for an API endpoint.
 *
 * In single-domain deployment (e.g. Next.js on Vercel or Render):
 *   Returns the relative path (e.g. "/api/chat").
 *
 * In decoupled split deployment (Frontend on Vercel, Backend on Render):
 *   Prefixes with NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL
 *   (e.g. "https://promptwar-challenge-6.onrender.com/api/chat").
 */
export function apiUrl(path: string): string {
  const envBackend =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (envBackend && envBackend.trim() !== "") {
    const trimmed = envBackend.trim().replace(/\/$/, "");
    return `${trimmed}${cleanPath}`;
  }

  return cleanPath;
}
