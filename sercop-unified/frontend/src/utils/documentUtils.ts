/**
 * Document utility functions for handling document downloads and previews
 * with proper authentication.
 */

import { TOKEN_STORAGE_KEY, API_BASE_URL } from '../config/api.config';

// Get the API origin (without /api suffix) for resolving relative URLs
const getApiOrigin = (): string => {
  // API_BASE_URL is like 'http://localhost:8000/api'
  // We need 'http://localhost:8000'
  return API_BASE_URL.replace(/\/api$/, '');
};

/**
 * Fix document URLs to work from any origin:
 * - In production: replace localhost references with current window origin
 * - Replace direct backend URLs (port 8080) with Kong URLs (port 8000)
 * - Remove duplicate /api/api/
 * - Convert relative URLs to absolute URLs using current origin
 */
export const fixDocumentUrl = (url: string): string => {
  if (!url) return url;

  let fixedUrl = url
    // Replace direct backend URLs with Kong URLs (MUST use Kong)
    .replace('http://localhost:8080', 'http://localhost:8000')
    .replace('https://localhost:8080', 'https://localhost:8000')
    // Fix duplicate /api/api/
    .replace('/api/api/', '/api/');

  // When running on a non-localhost origin (production/staging),
  // replace any localhost:8000 references with the current origin
  // so the browser can route through nginx proxy
  const currentOrigin = window.location.origin;
  if (!currentOrigin.includes('localhost')) {
    fixedUrl = fixedUrl
      .replace('http://localhost:8000', currentOrigin)
      .replace('https://localhost:8000', currentOrigin);
  }

  // If URL is relative (starts with /), prepend the current origin
  if (fixedUrl.startsWith('/') && !fixedUrl.startsWith('//')) {
    fixedUrl = currentOrigin + fixedUrl;
  }

  return fixedUrl;
};

/**
 * Open a document URL with authentication.
 * Fetches the document with the JWT token and opens it in a new tab.
 *
 * @param url - The document URL (will be fixed for legacy URLs)
 * @param fallbackToDirectOpen - If true, falls back to direct window.open on error
 */
export const openDocumentWithAuth = async (url: string): Promise<void> => {
  if (!url) {
    console.warn('openDocumentWithAuth: No URL provided');
    return;
  }

  const fixedUrl = fixDocumentUrl(url);
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    console.error('openDocumentWithAuth: No token found');
    alert('Sesión expirada. Por favor inicie sesión nuevamente.');
    return;
  }

  try {
    const response = await fetch(fixedUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');

    // Cleanup blob URL after 30 seconds
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  } catch (err) {
    console.error('Error opening document:', err);
    alert(`Error al abrir documento: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
};

/**
 * Download a document with authentication.
 * Fetches the document and triggers a download.
 *
 * @param url - The document URL
 * @param filename - Optional filename for the download
 */
export const downloadDocumentWithAuth = async (
  url: string,
  filename?: string
): Promise<void> => {
  if (!url) {
    console.warn('No URL provided to downloadDocumentWithAuth');
    return;
  }

  try {
    const fixedUrl = fixDocumentUrl(url);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    const response = await fetch(fixedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.error('Error downloading document:', err);
    throw err;
  }
};
