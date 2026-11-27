import { describe, expect, test } from 'vitest';
import { normalizeAlmamaterSize, normalizeTaiwanPhone } from './registration';

describe('registration contact and almamater data', () => {
  test('local and international Taiwan mobile numbers normalize consistently', () => {
    for (const value of ['0912345678', '0912 345 678', '+886 912-345-678', '886912345678']) {
      expect(normalizeTaiwanPhone(value)).toBe('+886912345678');
    }
  });
  test('a WhatsApp number from another country cannot stand in for the Taiwan phone', () => {
    for (const value of ['081234567890', '+6281234567890', '+8860912345678', '091234567', '09abcdefgh']) {
      expect(normalizeTaiwanPhone(value)).toBeNull();
    }
  });
  test('sizes accept free text rather than an enum', () => {
    expect(normalizeAlmamaterSize('  Ukuran khusus 2XL  ')).toBe('Ukuran khusus 2XL');
  });
  test('blank, multiline and oversized sizes are refused', () => {
    for (const value of ['', ' ', 'XL\nXXL', 'x'.repeat(31)]) expect(normalizeAlmamaterSize(value)).toBeNull();
  });
});
