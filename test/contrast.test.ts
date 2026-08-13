import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * WCAG AA contrast for the palette, in both themes.
 *
 * The tokens are read out of globals.css rather than duplicated here, so a
 * change to the palette is checked rather than silently diverging from the
 * test. Several of these were failing badly — --text-muted carried most of the
 * secondary copy at 2.56:1, less than a third of the 4.5:1 AA needs.
 *
 * Thresholds: 4.5:1 for normal text, 3:1 for large text and UI components.
 */

// Resolved from the project root: import.meta.url is not a file URL under the
// jsdom environment these run in.
const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

/** Reads a custom property out of a given block of globals.css. */
function token(name: string, block: 'light' | 'dark'): string {
  const source =
    block === 'light'
      ? css.slice(css.indexOf(':root {'), css.indexOf('.dark {'))
      : css.slice(css.indexOf('.dark {'));
  const match = source.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{3,8})`));
  if (!match) throw new Error(`token --${name} not found in the ${block} palette`);
  return match[1];
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_TEXT = 4.5;

/** Text tokens paired with every surface they are rendered on. */
const SURFACES = ['surface', 'background', 'surface-sunken'] as const;
const TEXT_TOKENS = ['foreground', 'text-body', 'text-muted'] as const;

describe.each(['light', 'dark'] as const)('%s palette', (theme) => {
  test.each(
    TEXT_TOKENS.flatMap((text) => SURFACES.map((surface) => [text, surface] as const)),
  )('%s on %s meets AA for normal text', (text, surface) => {
    const ratio = contrast(token(text, theme), token(surface, theme));

    expect(ratio, `${text} on ${surface} in ${theme} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test('the primary brand colour is readable on the page background', () => {
    const ratio = contrast(token('primary', theme), token('background', theme));

    expect(ratio, `primary in ${theme} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('white text on solid buttons', () => {
  // The shades the app actually paints buttons with. Each carries white label
  // text at 12–16px, which is normal text however bold it is — "large" starts
  // at 18.66px bold.
  const BUTTON_COLOURS: [name: string, hex: string][] = [
    ['--primary', token('primary', 'light')],
    ['--warm', token('warm', 'light')],
    ['indigo-600', '#4F46E5'],
    ['emerald-700', '#047857'],
    ['red-600', '#DC2626'],
  ];

  test.each(BUTTON_COLOURS)('white on %s meets AA', (_name, hex) => {
    expect(contrast('#ffffff', hex)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test('amber carries dark text, not white', () => {
    // amber-500 with white text was 2.15:1. Keeping the amber and flipping the
    // label to slate-900 preserves the "needs attention" colour and reads.
    expect(contrast('#ffffff', '#F59E0B')).toBeLessThan(AA_TEXT);
    expect(contrast('#0F172A', '#F59E0B')).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
