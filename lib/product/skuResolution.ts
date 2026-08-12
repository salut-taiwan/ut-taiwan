interface SkuLike {
  id: string;
  option_names: string[];
  price_display?: string | null;
}

interface VariantTypeLike {
  identifier: string;
}

/**
 * Find the SKU matching the shopper's current variant selection.
 *
 * Matching compares the two option lists as multisets rather than by
 * membership. A membership test (`every(v => selected.includes(v))`) treats
 * ["L","L"] and ["L","Navy"] as interchangeable whenever "L" is selected, so a
 * product whose size and colour share a value could resolve to the wrong SKU —
 * and the shopper would be charged for, and shipped, a different variant.
 *
 * Returns null while the selection is incomplete, so the caller can keep the
 * add-to-cart button disabled.
 */
export function resolveSku<T extends SkuLike>(
  skus: T[],
  variantTypes: VariantTypeLike[],
  selectedOptions: Record<string, string>,
): T | null {
  if (skus.length === 0) return null;
  // A product with no variants has exactly one buyable SKU.
  if (variantTypes.length === 0) return skus[0] ?? null;

  const selected = variantTypes.map(vt => selectedOptions[vt.identifier]);
  if (selected.some(v => v === undefined || v === '')) return null;

  return skus.find(sku => isSameSelection(sku.option_names, selected)) ?? null;
}

/** True when both lists hold the same values with the same multiplicities. */
function isSameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const remaining = [...b];
  for (const value of a) {
    const at = remaining.indexOf(value);
    if (at === -1) return false;
    remaining.splice(at, 1);
  }
  return true;
}

/** Whether the shopper has chosen enough to add anything to their cart. */
export function canAddToCart(
  skus: SkuLike[],
  variantTypes: VariantTypeLike[],
  selectedOptions: Record<string, string>,
): boolean {
  if (variantTypes.length === 0) return skus.length > 0;
  return resolveSku(skus, variantTypes, selectedOptions) !== null;
}
