import { describe, expect, test } from 'vitest';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/user/initials';
import { formatCountdown } from '@/lib/format/duration';
import { filterOrdersByKind } from '@/lib/orders/kindFilter';
import { resolveSku, canAddToCart } from '@/lib/product/skuResolution';

describe('cn', () => {
  test('joins the classes it is given', () => {
    expect(cn('a', 'b')).toContain('a');
    expect(cn('a', 'b')).toContain('b');
  });

  test('drops falsy entries so conditional classes stay readable', () => {
    expect(cn('a', false, null, undefined, '')).toBe('a');
  });

  test('nothing in, nothing out', () => {
    expect(cn()).toBe('');
  });

  test('conflicting utilities are both emitted — this is a joiner, not tailwind-merge', () => {
    // Callers must not rely on later classes overriding earlier ones; CSS source
    // order decides, so conditionals have to be written as either/or.
    expect(cn('px-2', 'px-4')).toBe('px-2 px-4');
  });
});

describe('getInitials', () => {
  test('a full name gives first and last initials', () => {
    expect(getInitials('Budi Santoso')).toBe('BS');
  });

  test('a single name gives one initial', () => {
    expect(getInitials('Budi')).toBe('B');
  });

  test('a middle name is skipped — first and last only', () => {
    expect(getInitials('Budi Rahmat Santoso')).toBe('BS');
  });

  test('stray whitespace does not produce blank initials', () => {
    expect(getInitials('  Budi   Santoso  ')).toBe('BS');
  });

  test('lower case input is capitalised', () => {
    expect(getInitials('budi santoso')).toBe('BS');
  });

  test('with no usable name the email stands in', () => {
    expect(getInitials('', 'budi@example.com')).toBe('B');
    expect(getInitials('   ', 'budi@example.com')).toBe('B');
    expect(getInitials(null, 'budi@example.com')).toBe('B');
  });

  test('with neither, the avatar still renders something', () => {
    expect(getInitials(null, null)).toBe('?');
    expect(getInitials(undefined, undefined)).toBe('?');
  });
});

describe('formatCountdown', () => {
  test('pads both halves to two digits', () => {
    expect(formatCountdown(300)).toBe('05:00');
    expect(formatCountdown(59)).toBe('00:59');
    expect(formatCountdown(61)).toBe('01:01');
  });

  test('zero reads as zero, not blank', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  test('an hour stays in minutes — this counts down a session, not a clock', () => {
    expect(formatCountdown(3600)).toBe('60:00');
  });

  test('a negative remainder clamps rather than showing "-1:-1"', () => {
    expect(formatCountdown(-5)).toBe('00:00');
  });

  test('fractional seconds are floored', () => {
    expect(formatCountdown(90.9)).toBe('01:30');
  });
});

describe('filterOrdersByKind', () => {
  const moduleOrder = { id: 'o-1', order_kind: 'module' as const };
  const merchOrder = { id: 'o-2', order_kind: 'merch' as const };
  const mixedOrder = { id: 'o-3', order_kind: 'mixed' as const };
  const all = [moduleOrder, merchOrder, mixedOrder];

  test('the "all" tab hides nothing', () => {
    expect(filterOrdersByKind(all, 'all')).toEqual(all);
  });

  test('the modules queue shows module orders', () => {
    expect(filterOrdersByKind(all, 'module').map(o => o.id)).toContain('o-1');
  });

  test('the merchandise queue shows merch orders', () => {
    expect(filterOrdersByKind(all, 'merch').map(o => o.id)).toContain('o-2');
  });

  test('an order holding both kinds appears in both queues', () => {
    // Hiding it from either team would strand the order.
    expect(filterOrdersByKind(all, 'module').map(o => o.id)).toContain('o-3');
    expect(filterOrdersByKind(all, 'merch').map(o => o.id)).toContain('o-3');
  });

  test('a merch queue excludes pure module orders', () => {
    expect(filterOrdersByKind(all, 'merch').map(o => o.id)).not.toContain('o-1');
  });

  test('an empty list stays empty', () => {
    expect(filterOrdersByKind([], 'module')).toEqual([]);
  });
});

describe('resolveSku', () => {
  const size = { identifier: 'size' };
  const colour = { identifier: 'colour' };

  const sku = (id: string, ...options: string[]) => ({ id, option_names: options });

  test('a product with no SKUs cannot resolve one', () => {
    expect(resolveSku([], [size], { size: 'L' })).toBeNull();
  });

  test('a product with no variants resolves its single SKU straight away', () => {
    const only = sku('s-1');
    expect(resolveSku([only], [], {})).toBe(only);
  });

  test('an incomplete selection resolves nothing', () => {
    const skus = [sku('s-1', 'L', 'Navy')];
    expect(resolveSku(skus, [size, colour], { size: 'L' })).toBeNull();
  });

  test('a complete selection resolves the matching SKU', () => {
    const target = sku('s-2', 'L', 'Navy');
    const skus = [sku('s-1', 'M', 'Navy'), target];
    expect(resolveSku(skus, [size, colour], { size: 'L', colour: 'Navy' })).toBe(target);
  });

  test('the order the options were chosen in does not matter', () => {
    const target = sku('s-1', 'Navy', 'L');
    expect(resolveSku([target], [size, colour], { size: 'L', colour: 'Navy' })).toBe(target);
  });

  test('a selection no SKU carries resolves nothing rather than guessing', () => {
    const skus = [sku('s-1', 'M', 'Navy')];
    expect(resolveSku(skus, [size, colour], { size: 'XXL', colour: 'Navy' })).toBeNull();
  });

  test('two variant types sharing a value cannot resolve the wrong SKU', () => {
    // Matching by membership would let ["L","L"] satisfy a {size:'L', colour:'Navy'}
    // selection, shipping the wrong variant.
    const sameTwice = sku('s-1', 'L', 'L');
    const correct = sku('s-2', 'L', 'Navy');
    const skus = [sameTwice, correct];
    expect(resolveSku(skus, [size, colour], { size: 'L', colour: 'Navy' })).toBe(correct);
    expect(resolveSku(skus, [size, colour], { size: 'L', colour: 'L' })).toBe(sameTwice);
  });

  test('a SKU with a different number of options never matches', () => {
    const skus = [sku('s-1', 'L', 'Navy', 'Cotton')];
    expect(resolveSku(skus, [size, colour], { size: 'L', colour: 'Navy' })).toBeNull();
  });

  test('an empty-string selection counts as unselected', () => {
    const skus = [sku('s-1', 'L', 'Navy')];
    expect(resolveSku(skus, [size, colour], { size: 'L', colour: '' })).toBeNull();
  });
});

describe('canAddToCart', () => {
  const size = { identifier: 'size' };

  test('a variant-less product can be added as soon as it has a SKU', () => {
    expect(canAddToCart([{ id: 's-1', option_names: [] }], [], {})).toBe(true);
  });

  test('a variant-less product with no SKUs cannot', () => {
    expect(canAddToCart([], [], {})).toBe(false);
  });

  test('a variant product needs a complete, matching selection', () => {
    const skus = [{ id: 's-1', option_names: ['L'] }];
    expect(canAddToCart(skus, [size], {})).toBe(false);
    expect(canAddToCart(skus, [size], { size: 'XXL' })).toBe(false);
    expect(canAddToCart(skus, [size], { size: 'L' })).toBe(true);
  });
});
