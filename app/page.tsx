import type { FeesConfig } from '@/lib/api';
import HomePageContent from './_components/HomePageContent';

async function getFees(): Promise<FeesConfig | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/fees`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const fees = await getFees();
  return <HomePageContent fees={fees} />;
}
