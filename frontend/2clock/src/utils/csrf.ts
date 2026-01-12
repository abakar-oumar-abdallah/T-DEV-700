/**
 * CSRF Token Utilities
 *
 * Handles CSRF token management for API requests
 */

/**
 * Get CSRF token from cookies
 * @returns The CSRF token or null if not found
 */
export const getCsrfTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Fetch a new CSRF token from the backend
 * @param backendUrl - The backend base URL
 * @returns Promise that resolves when the token is fetched
 */
export const fetchCsrfToken = async (backendUrl: string): Promise<void> => {
  await fetch(`${backendUrl}/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });
};

/**
 * Get CSRF token, fetching it from the server if not already present
 * @param backendUrl - The backend base URL
 * @returns The CSRF token or null if unable to fetch
 */
export const ensureCsrfToken = async (backendUrl: string): Promise<string | null> => {
  let token = getCsrfTokenFromCookie();

  if (!token) {
    await fetchCsrfToken(backendUrl);
    token = getCsrfTokenFromCookie();
  }

  return token;
};
