import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { assertPublicUrl } from './fetchPage.ts';
import { HttpError } from './http.ts';

Deno.test('assertPublicUrl accepts public shop links', () => {
  assertEquals(assertPublicUrl('https://www.zara.com/tr/x.html').hostname, 'www.zara.com');
});

for (const url of [
  'http://localhost:3000',
  'http://127.0.0.1',
  'http://10.0.0.5/x',
  'http://192.168.1.1',
  'http://[::1]/',
  'file:///etc/passwd',
  'not a url',
  // regression: trailing-dot and sub-domain forms of internal names
  'http://localhost./',
  'http://api.localhost/',
  'http://metadata.google.internal./computeMetadata/v1/',
  'http://printer.local./',
  // regression: carrier-grade NAT range and numeric IPv4 spellings of loopback
  'http://100.64.0.1/',
  'http://100.127.255.254/',
  'http://2130706433/',
  'http://0x7f.0.0.1/',
  'http://0.0.0.0/',
  'http://169.254.169.254/latest/meta-data/',
]) {
  Deno.test(`assertPublicUrl rejects ${url}`, () => {
    assertThrows(() => assertPublicUrl(url), HttpError);
  });
}

for (const url of ['https://100.128.0.1/', 'https://pinterest.com/pin/1', 'https://shop.example.co.uk/item']) {
  Deno.test(`assertPublicUrl still accepts ${url}`, () => {
    assertEquals(typeof assertPublicUrl(url).hostname, 'string');
  });
}
