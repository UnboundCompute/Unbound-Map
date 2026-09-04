import { redirect } from 'next/navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function queryString(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach((item) => item && query.append(key, item)));
  const result = query.toString();
  return result ? `?${result}` : '';
}

export default async function LegacyMapPage({ searchParams }: { searchParams: SearchParams }) { redirect(`/architecture${queryString(await searchParams)}`); }
