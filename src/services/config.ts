// Centralized API base URL detection
// Uses VITE_API_BASE_URL if provided, otherwise detects environment
// On Vercel/production: use relative paths to serverless functions
// On localhost: use port 4000 for Express server

const getApiBase = (): string => {
  // If explicitly set, use that
  if ((import.meta as any)?.env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  
  // Check if we're on Vercel/production (hostname ends with .vercel.app or is a custom domain)
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') || 
                       hostname !== 'localhost' && hostname !== '127.0.0.1';
  
  if (isProduction) {
    // On Vercel, use relative paths to serverless functions
    return '';
  }
  
  // On localhost, use Express server on port 4000
  return `http://${hostname}:4000`;
};

export const API_BASE: string = getApiBase();


