import { describe, expect, test } from 'vitest';
import { isModulePurchasable, moduleCtaLabel, modulePriceState } from '@/lib/modulePricing';

describe('modulePriceState', () => {
  test('priced and in stock is purchasable', () => {
    expect(modulePriceState({ is_available: true, price_student: 50000 })).toBe('purchasable');
  });

  test('priced but out of stock has to be requested', () => {
    expect(modulePriceState({ is_available: false, price_student: 50000 })).toBe('unavailable');
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['zero', 0],
    ['the string "0.00" a raw query returns', '0.00'],
  ])('price %s means the price is not set yet, whatever the stock says', (_label, price) => {
    expect(modulePriceState({ is_available: true, price_student: price })).toBe('needs_price');
    expect(modulePriceState({ is_available: false, price_student: price })).toBe('needs_price');
  });

  test('a numeric string price is still a price', () => {
    expect(modulePriceState({ is_available: true, price_student: '50000.00' })).toBe('purchasable');
  });

  test('an unparseable price is treated as unset', () => {
    expect(modulePriceState({ is_available: true, price_student: 'abc' })).toBe('needs_price');
  });
});

describe('isModulePurchasable / moduleCtaLabel', () => {
  test('only a priced, in-stock module can be bought outright', () => {
    expect(isModulePurchasable({ is_available: true, price_student: 50000 })).toBe(true);
    expect(isModulePurchasable({ is_available: false, price_student: 50000 })).toBe(false);
    expect(isModulePurchasable({ is_available: true, price_student: 0 })).toBe(false);
  });

  test('the button asks for a request when the module cannot be bought', () => {
    expect(moduleCtaLabel({ is_available: true, price_student: 50000 })).toBe('Tambah ke Keranjang');
    expect(moduleCtaLabel({ is_available: true, price_student: 0 })).toBe('Minta Buku Ini');
  });
});
