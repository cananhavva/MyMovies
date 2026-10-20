import { detectPlatform } from './platformDetect';
import { validateUrl } from './urlValidation';

describe('detectPlatform', () => {
  it.each`
    url                                              | platform       | kind         | handle         | restricted
    ${'https://www.instagram.com/elif.style/'}       | ${'instagram'} | ${'profile'} | ${'elif.style'} | ${true}
    ${'https://instagram.com/p/Cx12ab/'}             | ${'instagram'} | ${'post'}    | ${undefined}   | ${true}
    ${'https://www.tiktok.com/@zeynep'}              | ${'tiktok'}    | ${'profile'} | ${'zeynep'}    | ${true}
    ${'https://www.tiktok.com/@zeynep/video/123'}    | ${'tiktok'}    | ${'post'}    | ${'zeynep'}    | ${true}
    ${'https://tr.pinterest.com/deniz/'}             | ${'pinterest'} | ${'profile'} | ${'deniz'}     | ${false}
    ${'https://www.pinterest.co.uk/pin/123/'}        | ${'pinterest'} | ${'post'}    | ${undefined}   | ${false}
    ${'https://pin.it/abc'}                          | ${'pinterest'} | ${'post'}    | ${undefined}   | ${false}
    ${'https://www.shopltk.com/explore/stylist'}     | ${'ltk'}       | ${'profile'} | ${'stylist'}   | ${false}
    ${'https://liketoknow.it/stylist'}               | ${'ltk'}       | ${'profile'} | ${'stylist'}   | ${false}
    ${'https://www.zara.com/tr/tr/trenckot-p1.html'} | ${'other'}     | ${'unknown'} | ${undefined}   | ${false}
  `('$url → $platform/$kind', ({ url, platform, kind, handle, restricted }) => {
    const info = detectPlatform(url);
    expect(info).toMatchObject({ platform, kind, restricted });
    expect(info.handle).toBe(handle);
  });
});

describe('validateUrl', () => {
  it('adds https to bare domains', () => {
    expect(validateUrl('zara.com/tr/x')).toEqual({ ok: true, value: 'https://zara.com/tr/x' });
  });

  it('extracts a link from shared text', () => {
    expect(validateUrl('Bunu gör: https://www.trendyol.com/abc-p-1 çok güzel')).toEqual({
      ok: true,
      value: 'https://www.trendyol.com/abc-p-1',
    });
  });

  it.each(['', 'merhaba', 'ftp://files.example.com/x', 'javascript:alert(1)', 'http://localhost'])('rejects %p', (input) => {
    const result = validateUrl(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('LINK_INVALID');
  });
});

describe('detectPlatform – more hosts and paths', () => {
  it.each`
    url                                                  | platform       | kind         | handle
    ${'https://instagram.com/someone?igsh=abc123'}       | ${'instagram'} | ${'profile'} | ${'someone'}
    ${'https://m.instagram.com/a.b_c'}                   | ${'instagram'} | ${'profile'} | ${'a.b_c'}
    ${'https://INSTAGRAM.COM/User'}                      | ${'instagram'} | ${'profile'} | ${'User'}
    ${'https://www.instagram.com/reel/abc/'}             | ${'instagram'} | ${'post'}    | ${undefined}
    ${'https://www.instagram.com/stories/someone/1/'}    | ${'instagram'} | ${'post'}    | ${undefined}
    ${'https://instagr.am/someone'}                      | ${'instagram'} | ${'profile'} | ${'someone'}
    ${'https://www.instagram.com/'}                      | ${'instagram'} | ${'unknown'} | ${undefined}
    ${'https://vm.tiktok.com/ZMabc/'}                    | ${'tiktok'}    | ${'unknown'} | ${undefined}
    ${'https://www.tiktok.com/tag/ootd'}                 | ${'tiktok'}    | ${'post'}    | ${undefined}
    ${'https://pinterest.com/deniz/fall-outfits/'}       | ${'pinterest'} | ${'post'}    | ${'deniz'}
    ${'https://www.pinterest.de/pin/987/'}               | ${'pinterest'} | ${'post'}    | ${undefined}
    ${'https://www.pinterest.com.au/deniz/'}             | ${'pinterest'} | ${'profile'} | ${'deniz'}
    ${'https://www.shopltk.com/explore/stylist/posts/1'} | ${'ltk'}       | ${'post'}    | ${'stylist'}
    ${'https://www.liketoknow.it/stylist'}               | ${'ltk'}       | ${'profile'} | ${'stylist'}
  `('$url → $platform/$kind/$handle', ({ url, platform, kind, handle }) => {
    const info = detectPlatform(url);
    expect(info).toMatchObject({ platform, kind });
    expect(info.handle).toBe(handle);
  });

  it('marks Instagram/TikTok restricted and Pinterest/LTK og:image capable', () => {
    expect(detectPlatform('https://instagram.com/x')).toMatchObject({ restricted: true, supportsOgImage: false });
    expect(detectPlatform('https://tiktok.com/@x')).toMatchObject({ restricted: true, supportsOgImage: false });
    expect(detectPlatform('https://pin.it/x')).toMatchObject({ restricted: false, supportsOgImage: true });
    expect(detectPlatform('https://liketoknow.it/x')).toMatchObject({ restricted: false, supportsOgImage: true });
  });

  // Regression: /pinterest\.[a-z.]+$/ accepted any domain that merely starts with "pinterest.".
  it.each([
    'https://pinterest.evil.com/x',
    'https://pinterest.com.evil.io/x',
    'https://notinstagram.com/x',
    'https://instagram.com.evil.io/x',
    'https://mytiktok.com/@x',
    'https://shopltk.com.evil.io/x',
    'https://pin.it.evil.io/x',
  ])('does not treat look-alike host %s as a supported platform', (url) => {
    expect(detectPlatform(url)).toEqual({ platform: 'other', kind: 'unknown', restricted: false, supportsOgImage: false });
  });

  it.each(['', 'not a url', 'instagram.com/someone', '://', 'http://'])('returns "other" for malformed input %p', (url) => {
    expect(detectPlatform(url).platform).toBe('other');
  });
});

describe('validateUrl – more inputs', () => {
  it.each`
    input                                                   | value
    ${'  https://zara.com/a?b=1  '}                         | ${'https://zara.com/a?b=1'}
    ${'HTTPS://ZARA.COM'}                                   | ${'https://zara.com/'}
    ${'www.zara.com/tr/'}                                   | ${'https://www.zara.com/tr/'}
    ${'http://shop.example.com/x'}                          | ${'http://shop.example.com/x'}
    ${'https://shop.example.com/x?ref=a#b'}                 | ${'https://shop.example.com/x?ref=a#b'}
    ${'https://en.wikipedia.org/wiki/Trench_(coat)'}        | ${'https://en.wikipedia.org/wiki/Trench_(coat)'}
  `('accepts $input', ({ input, value }) => {
    expect(validateUrl(input)).toEqual({ ok: true, value });
  });

  // Regression: sentence punctuation after a shared link became part of the URL.
  it.each`
    input                                               | value
    ${'Bak: https://www.zara.com/tr/x.html.'}           | ${'https://www.zara.com/tr/x.html'}
    ${'Şuna bak (https://zara.com/x)'}                  | ${'https://zara.com/x'}
    ${'https://zara.com/x, ne dersin?'}                 | ${'https://zara.com/x'}
    ${'Link: zara.com/x!'}                              | ${'https://zara.com/x'}
    ${'"https://zara.com/x"'}                           | ${'https://zara.com/x'}
  `('strips trailing punctuation from $input', ({ input, value }) => {
    expect(validateUrl(input)).toEqual({ ok: true, value });
  });

  it.each(['https://', 'https://exa mple.com', 'data:text/html,hi', 'mailto:a@b.com', 'file:///etc/passwd', 'javascript://zara.com/%0aalert(1)', 'zara'])(
    'rejects %p',
    (input) => {
      const result = validateUrl(input);
      expect(!result.ok && result.error.code).toBe('LINK_INVALID');
    },
  );
});
