import { randomBytes } from 'node:crypto';

export function slugifyWorkspaceName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base.length >= 2 ? base : 'workspace';
}

export function uniqueSlugSuffix(): string {
  return randomBytes(3).toString('hex');
}
