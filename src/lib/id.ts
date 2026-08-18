/**
 * CineFlow AI — Centralized Safe ID Generator
 * Uses crypto.randomUUID when available with fallback.
 */

export function generateId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
