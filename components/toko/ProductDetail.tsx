'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import type { ClaimCta, ProductDTO, ProductSKUDTO } from '@/types';


export default function ProductDetail({ product }: { product: ProductDTO }) {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const images = product.product_images ?? [];
  const variantTypes = product.product_variant_types ?? [];
  const skus = product.product_skus ?? [];

  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  // Claim-gated products fetch their per-user CTA from the BE client-side
  // (the SSR /products/:id response is shared across users and must not leak
  // per-user state).
  const isClaimGated = product.claim_rule === 'salut_sem1_once';
  const [claimCta, setClaimCta] = useState<ClaimCta | null>(null);
  const [claimCtaLoading, setClaimCtaLoading] = useState(isClaimGated);

  useEffect(() => {
    if (!isClaimGated) return;
    let cancelled = false;
    setClaimCtaLoading(true);
    api.products.getClaimCta(product.id)
      .then(res => { if (!cancelled) setClaimCta(res.claim_cta); })
      .catch(() => { if (!cancelled) setClaimCta(null); })
      .finally(() => { if (!cancelled) setClaimCtaLoading(false); });
    return () => { cancelled = true; };
    // Re-fetch when auth state flips (login/logout) so the CTA reflects the current user.
  }, [isClaimGated, product.id, user?.id]);

  // Find the SKU that matches the current selection
  const resolvedSku: ProductSKUDTO | null = (() => {
    if (skus.length === 0) return null;
    if (variantTypes.length === 0) return skus[0] ?? null;
    const selectedValues = Object.values(selectedOptions);
    if (selectedValues.length < variantTypes.length) return null;
    return skus.find(s =>
      s.option_names.length === selectedValues.length &&
      s.option_names.every(v => selectedValues.includes(v))
    ) ?? null;
  })();

  const canAdd = variantTypes.length === 0 ? skus.length > 0 : resolvedSku !== null;
  const displayPriceLabel = resolvedSku?.price_display ?? product.base_price_display ?? '';

  async function handleAddToCart() {
    if (!user) { router.push('/login'); return; }
    const skuId = resolvedSku?.id ?? skus[0]?.id;
    if (!skuId) return;
    setAdding(true);
    try {
      await api.cart.addMerch(skuId, 1);
      await refreshCart();
      showToast('Ditambahkan ke keranjang');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang', 'error');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/toko" className="text-sm text-indigo-600 hover:underline">&larr; Toko</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square bg-[var(--surface-sunken)] rounded-2xl overflow-hidden relative">
            {images[activeImage] ? (
              <Image
                src={images[activeImage].image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 6.75h18M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors duration-150 ${
                    activeImage === i ? 'border-indigo-500' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} ${i + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            {product.category.replace(/-/g, ' ')}
          </span>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mt-1 mb-2">{product.name}</h1>

          {isClaimGated && (
            <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Khusus Anggota SALUT
            </div>
          )}

          <p className={`text-2xl font-bold tabular-nums mb-5 ${isClaimGated ? 'text-teal-700' : 'text-[var(--foreground)]'}`}>
            {displayPriceLabel}
          </p>

          {/* Variant selectors */}
          {variantTypes.map(vt => (
            <div key={vt.id} className="mb-4">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2 capitalize">{vt.name}</p>
              <div className="flex flex-wrap gap-2">
                {(vt.product_variant_options ?? []).map(opt => {
                  const isSelected = selectedOptions[vt.identifier] === opt.value;
                  if (opt.hex_color) {
                    return (
                      <button
                        key={opt.id}
                        title={opt.value}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [vt.identifier]: opt.value }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                          isSelected ? 'border-indigo-500 scale-110 ring-2 ring-indigo-200' : 'border-[var(--border)]'
                        }`}
                        style={{ backgroundColor: opt.hex_color }}
                      />
                    );
                  }
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [vt.identifier]: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-[border-color,background-color,color] duration-150 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-[var(--border)] text-[var(--text-body)] hover:border-indigo-300'
                      }`}
                    >
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA */}
          {isClaimGated ? (
            <ClaimCtaButton
              cta={claimCta}
              loading={claimCtaLoading}
              adding={adding}
              canAdd={canAdd}
              hasVariants={variantTypes.length > 0}
              onClaim={handleAddToCart}
            />
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!canAdd || adding}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
            >
              {adding ? (
                <>
                  <span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" />
                  Menambahkan...
                </>
              ) : !canAdd && variantTypes.length > 0 ? (
                'Pilih ukuran/warna terlebih dahulu'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Tambah ke Keranjang
                </>
              )}
            </button>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Deskripsi</p>
              <p className="text-sm text-[var(--text-body)] whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CTA_BASE_CLASS = 'w-full mt-2 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]';

function ClaimCtaButton({
  cta,
  loading,
  adding,
  canAdd,
  hasVariants,
  onClaim,
}: {
  cta: ClaimCta | null;
  loading: boolean;
  adding: boolean;
  canAdd: boolean;
  hasVariants: boolean;
  onClaim: () => void;
}) {
  if (loading) {
    return <div className={CTA_BASE_CLASS + ' opacity-60'} role="status" aria-busy="true">…</div>;
  }
  if (!cta) {
    return <button disabled className={CTA_BASE_CLASS}>Tidak tersedia</button>;
  }
  if (cta.href) {
    return (
      <Link href={cta.href} className={CTA_BASE_CLASS}>
        {cta.label}
      </Link>
    );
  }
  if (cta.addToCart) {
    // UI gate: when the product has variants, the user must select them all
    // before the claim button activates. Prevents an accidental wrong-size claim.
    if (hasVariants && !canAdd) {
      return <button disabled className={CTA_BASE_CLASS}>Pilih ukuran/warna terlebih dahulu</button>;
    }
    return (
      <button onClick={onClaim} disabled={adding} className={CTA_BASE_CLASS}>
        {adding ? (
          <>
            <span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" />
            Menambahkan...
          </>
        ) : (
          cta.label
        )}
      </button>
    );
  }
  return <button disabled className={CTA_BASE_CLASS}>{cta.label}</button>;
}
