export function storageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const match = url.match(/\.supabase\.co(\/storage\/.+)/);
  if (match) return `/supabase-storage${match[1]}`;
  return url;
}
