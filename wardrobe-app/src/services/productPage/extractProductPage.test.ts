import { extractProductPage, looksBlocked, productPageToPrompt } from './extractProductPage';

const PRODUCT_HTML = `<!doctype html><html><head>
<title>Shop – Wool Coat</title>
<meta property="og:title" content="Wool Coat &amp; Belt">
<meta property="og:image" content="https://cdn.shop.com/coat.jpg">
<meta name="description" content="A warm coat">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product","name":"Wool Coat","material":"80% wool, 20% polyamide","offers":{"price":"4999","priceCurrency":"TRY"}}]}</script>
<script>var tracking = "ignore me";</script>
<style>.x{color:red}</style>
</head><body><h1>Wool Coat</h1><p>Composition: 80% wool</p></body></html>`;

describe('extractProductPage', () => {
  const data = extractProductPage(PRODUCT_HTML);

  it('reads og tags and decodes entities', () => {
    expect(data.title).toBe('Wool Coat & Belt');
    expect(data.imageUrl).toBe('https://cdn.shop.com/coat.jpg');
    expect(data.description).toBe('A warm coat');
  });

  it('finds Product objects inside JSON-LD @graph', () => {
    expect(data.jsonLdProducts).toHaveLength(1);
    expect(data.jsonLdProducts[0]).toContain('80% wool');
  });

  it('keeps visible text and drops scripts and styles', () => {
    expect(data.visibleText).toContain('Composition: 80% wool');
    expect(data.visibleText).not.toContain('ignore me');
    expect(data.visibleText).not.toContain('color:red');
  });

  it('is not considered blocked', () => {
    expect(looksBlocked(PRODUCT_HTML, data)).toBe(false);
  });

  it('builds a prompt containing every source', () => {
    const prompt = productPageToPrompt('https://shop.com/coat', data);
    expect(prompt).toContain('URL: https://shop.com/coat');
    expect(prompt).toContain('JSON-LD Product');
  });
});

describe('looksBlocked', () => {
  it('detects captcha walls and empty JS shells', () => {
    const captcha = '<html><body><div id="px-captcha">Are you a robot?</div></body></html>';
    expect(looksBlocked(captcha, extractProductPage(captcha))).toBe(true);
    const shell = '<html><body><div id="root"></div></body></html>';
    expect(looksBlocked(shell, extractProductPage(shell))).toBe(true);
  });
});
