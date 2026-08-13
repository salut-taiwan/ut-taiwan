import { describe, expect, test } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Every interactive control has to be nameable by a screen reader.
 *
 * This is a source scan rather than a render test because the failure mode is
 * one nobody notices by looking: an icon-only button or a bare table checkbox
 * renders perfectly and announces as "button" or "checkbox". Several shipped
 * that way — the cart's quantity steppers, the checkout address fields, the
 * admin select-all boxes — and each was found by a test failing to select
 * them, not by anyone using the site.
 */

const files = execSync("find app components -name '*.tsx' ! -name '*.test.tsx'", {
  encoding: 'utf8',
  cwd: process.cwd(),
})
  .trim()
  .split('\n');

/** An input is named if it has an id (for a <label htmlFor>), aria-label, or is wrapped in a <label>. */
function unnamedInputs(src: string): string[] {
  const out: string[] = [];
  const re = /<input\b[\s\S]{0,600}?\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const tag = m[0];
    if (/\bid=|aria-label|aria-labelledby|type="hidden"/.test(tag)) continue;
    // A file input inside a <label> is named by the label's own text. Counted
    // from the top of the file, not a fixed window: these labels open well
    // before the input, with an icon and a caption in between.
    const before = src.slice(0, m.index);
    const wrapped = (before.match(/<label\b/g) || []).length > (before.match(/<\/label>/g) || []).length;
    if (wrapped) continue;
    const line = src.slice(0, m.index).split('\n').length;
    out.push(`line ${line}: ${tag.slice(0, 60).replace(/\s+/g, ' ')}`);
  }
  return out;
}

describe('every control can be announced', () => {
  test.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8');

    expect(unnamedInputs(src), `inputs with no accessible name in ${file}`).toEqual([]);
  });

  test('images always carry an alt attribute, even if empty', () => {
    // alt="" is correct for decoration; a missing alt makes a screen reader
    // read the file name.
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const img of src.match(/<img\b[^>]*>/g) ?? []) {
        if (!/\balt=/.test(img)) offenders.push(`${file}: ${img.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
