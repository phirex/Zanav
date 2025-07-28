// In single-tenant mode we no longer need to attach tenant headers or look up
// a tenant ID.  The helper now simply passes through any provided headers so
// existing calls don’t break while we remove them gradually.

export function createTenantHeaders(
  additionalHeaders: HeadersInit = {},
): Headers {
  return new Headers(additionalHeaders);
}

// Deprecated – kept only so legacy imports compile (returns null)
export function getTenantIdFromCookie(): string | null {
  return null;
}

/**
 * Fetch helper with tenant context
 */
export async function fetchWithTenant<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  // Simply forward the request in single-tenant mode
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(
        `Error fetching ${url}: ${response.statusText} (${response.status})`,
      );
    }
    return response.json();
  } catch (error) {
    console.error(`fetch error for ${url}:`, error);
    throw error;
  }
}
