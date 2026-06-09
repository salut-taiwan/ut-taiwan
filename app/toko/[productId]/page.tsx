import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ProductDTO } from '@/types';
import ProductDetail from '@/components/toko/ProductDetail';

async function fetchProduct(id: string): Promise<ProductDTO | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await fetchProduct(productId);
  if (!product) return { title: 'Produk tidak ditemukan' };
  return {
    title: `${product.name} | Toko UT Taiwan`,
    description: product.description?.slice(0, 155) ?? `Beli ${product.name} di Toko UT Taiwan.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await fetchProduct(productId);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
