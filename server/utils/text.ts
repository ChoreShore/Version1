export function formatEmployerName(firstName: string | null, lastName: string | null): string {
  if (!firstName) return 'Anonymous';
  const first = firstName.trim();
  const initial = lastName?.trim()?.[0];
  return initial ? `${first} ${initial}.` : first;
}
