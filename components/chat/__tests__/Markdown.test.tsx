import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Markdown from '@/components/chat/Markdown';

// Chat content comes from an AI service over a socket, so this renderer is a
// trust boundary: whatever it will not render cannot reach the page.

describe('image sources', () => {
  test('an https image renders, wrapped in a link that opens safely', () => {
    render(<Markdown content="![cover](https://cdn.example.com/a.png)" />);
    const img = screen.getByRole('img', { name: 'cover' });
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/a.png');
    const link = img.closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  test('a plain http image is not rendered', () => {
    render(<Markdown content="![x](http://insecure.example.com/a.png)" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('a data URI image is not rendered', () => {
    render(<Markdown content="![x](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('a relative or protocol-relative source is not rendered', () => {
    render(<Markdown content={'![a](/local.png)\n\n![b](//cdn.example.com/x.png)'} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('a javascript: source is not rendered', () => {
    render(<Markdown content="![x](javascript:alert(1))" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('sanitisation of raw HTML', () => {
  test('a script tag never reaches the document', () => {
    const { container } = render(<Markdown content={'<script>alert(1)</script>'} />);
    expect(container.querySelector('script')).toBeNull();
  });

  test('an inline error handler is stripped from a raw image tag', () => {
    const { container } = render(<Markdown content={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  test('an iframe is stripped', () => {
    const { container } = render(<Markdown content={'<iframe src="https://evil.example.com"></iframe>'} />);
    expect(container.querySelector('iframe')).toBeNull();
  });
});

describe('links', () => {
  test('a markdown link opens in a new tab without leaking the referrer', () => {
    render(<Markdown content="[panduan](https://ut-taiwan.org/panduan)" />);
    const link = screen.getByRole('link', { name: 'panduan' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });
});

describe('formatting', () => {
  test('bold and italics render as emphasis, not literal asterisks', () => {
    const { container } = render(<Markdown content="**tebal** dan *miring*" />);
    expect(container.querySelector('strong')).toHaveTextContent('tebal');
    expect(container.querySelector('em')).toHaveTextContent('miring');
  });

  test('a fenced block renders as code', () => {
    const { container } = render(<Markdown content={'```js\nconst a = 1;\n```'} />);
    expect(container.querySelector('code')).toBeTruthy();
  });

  test('a GFM table renders as a table', () => {
    const { container } = render(<Markdown content={'| a | b |\n| - | - |\n| 1 | 2 |'} />);
    expect(container.querySelector('table')).toBeTruthy();
    expect(container.querySelectorAll('th')).toHaveLength(2);
  });

  test('a list renders as list items', () => {
    const { container } = render(<Markdown content={'- satu\n- dua'} />);
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  test('headings are contained so a chat bubble cannot dominate the page', () => {
    const { container } = render(<Markdown content={'# Judul\n\n## Sub'} />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h2')).toBeNull();
    expect(container.querySelectorAll('h3').length).toBeGreaterThan(0);
  });

  test('empty content renders nothing rather than crashing', () => {
    expect(() => render(<Markdown content="" />)).not.toThrow();
  });
});
