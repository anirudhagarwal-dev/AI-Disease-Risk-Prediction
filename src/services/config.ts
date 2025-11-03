// Centralized API base URL detection
// Uses VITE_API_BASE_URL if provided, otherwise defaults to same-host port 4000

export const API_BASE: string = (import.meta as any)?.env?.VITE_API_BASE_URL
  || `http://${window.location.hostname}:4000`;


