/**
 * Route utility functions for authentication and navigation
 */

import { PUBLIC_ROUTES } from '@/shared/constants';

/**
 * Checks if the current pathname corresponds to a public page that doesn't require authentication.
 *
 * Public pages include the landing page, login, register, and setup flows.
 * This function handles both exact matches and path prefixes (e.g., /login/forgot-password).
 *
 * @param pathname The pathname to check (defaults to current window location)
 * @returns true if the page is public and doesn't require authentication
 *
 * @example
 * // Check current page
 * if (isPublicPage()) {
 *   console.log('No auth required');
 * }
 *
 * // Check specific path
 * if (isPublicPage('/login')) {
 *   console.log('Login page is public');
 * }
 */
export function isPublicPage(pathname: string = window.location.pathname): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}
