/**
 * getApiBase()
 *
 * Returns the base URL for all API calls.
 *
 * - In production (deployed): reads VITE_API_BASE_URL from env
 *   (e.g. "https://kisanmitra-backend.onrender.com")
 * - In local development: returns "" (empty string) so all fetches
 *   use relative paths like /api/... which Vite's dev-server proxy
 *   forwards to localhost:8000.
 *   This works both from the PC browser (localhost:5173) AND from a
 *   mobile device on the same WiFi (<LAN-IP>:5173), because the proxy
 *   runs server-side on the PC — not in the browser.
 */
export const getApiBase = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  // Return the env value only when it is a non-empty, non-whitespace string
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : '';
};
