export function parseRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) {
    return roles.filter((r): r is string => typeof r === 'string');
  }

  if (roles && typeof roles === 'object') {
    const values = Object.values(roles as Record<string, unknown>);
    return values.filter((v): v is string => typeof v === 'string');
  }

  if (typeof roles === 'string') {
    const normalized = roles.replace(/[{}]/g, '');
    if (!normalized) return [];
    return normalized.split(',').map((r) => r.trim());
  }

  return [];
}

export function hasRole(roles: unknown, role: string): boolean {
  return parseRoles(roles).includes(role);
}
