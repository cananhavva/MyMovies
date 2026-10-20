import { normalizeLabelText, parseComposition } from './compositionParser';

describe('parseComposition', () => {
  it('reads Turkish "percent first" labels', () => {
    expect(parseComposition('%80 yün %20 polyamid').shell).toEqual([
      { fiber: 'wool', percent: 80 },
      { fiber: 'polyamide', percent: 20 },
    ]);
  });

  it('reads "fibre first" labels without shifting fibres', () => {
    expect(parseComposition('wool 80%, polyamide 20%').shell).toEqual([
      { fiber: 'wool', percent: 80 },
      { fiber: 'polyamide', percent: 20 },
    ]);
  });

  it.each([
    ['100% Baumwolle', 'cotton'],
    ['100% coton', 'cotton'],
    ['100% algodón', 'cotton'],
    ['100% seide', 'silk'],
    ['100% soie', 'silk'],
    ['100% leinen', 'linen'],
    ['100% lino', 'linen'],
    ['100% laine', 'wool'],
    ['100% lana', 'wool'],
    ['100% WOLLE', 'wool'],
    ['%100 viskon', 'viscose'],
    ['100% rayon', 'viscose'],
    ['%100 poliester', 'polyester'],
    ['%100 kaşmir', 'cashmere'],
  ])('recognises %s as %s', (text, fiber) => {
    expect(parseComposition(text).shell).toEqual([{ fiber, percent: 100 }]);
  });

  it('maps elastane synonyms', () => {
    const fibers = ['95% cotton 5% spandex', '95% cotton 5% lycra', '%95 pamuk %5 elastan'].map(
      (text) => parseComposition(text).shell[1]?.fiber,
    );
    expect(fibers).toEqual(['elastane', 'elastane', 'elastane']);
  });

  it('prefers multi-word fibres such as organic cotton and merino wool', () => {
    expect(parseComposition('70% organic cotton 30% merino wool').shell).toEqual([
      { fiber: 'organic_cotton', percent: 70 },
      { fiber: 'merino', percent: 30 },
    ]);
  });

  it('keeps only the shell and reads the lining separately', () => {
    const parsed = parseComposition('Dış kumaş: %100 polyester\nAstar: %100 viskon');
    expect(parsed.shell).toEqual([{ fiber: 'polyester', percent: 100 }]);
    expect(parsed.lining).toEqual([{ fiber: 'viscose', percent: 100 }]);
  });

  it('ignores filling sections', () => {
    const parsed = parseComposition('Shell: 100% nylon. Filling: 90% down 10% feather');
    expect(parsed.shell).toEqual([{ fiber: 'nylon', percent: 100 }]);
  });

  it('accepts decimal commas', () => {
    expect(parseComposition('%52,5 pamuk %47,5 polyester').shell[0]).toEqual({ fiber: 'cotton', percent: 52.5 });
  });

  it('normalises totals outside 95–105 %', () => {
    const parsed = parseComposition('60% wool 20% polyamide');
    expect(parsed.normalized).toBe(true);
    expect(parsed.shell).toEqual([
      { fiber: 'wool', percent: 75 },
      { fiber: 'polyamide', percent: 25 },
    ]);
  });

  it('keeps totals within tolerance unchanged', () => {
    const parsed = parseComposition('97% cotton');
    expect(parsed.normalized).toBe(false);
    expect(parsed.shell).toEqual([{ fiber: 'cotton', percent: 97 }]);
  });

  it('flags compositions under 50 % as unusable', () => {
    const parsed = parseComposition('30% cotton');
    expect(parsed.usable).toBe(false);
  });

  it('counts unknown words as "other" and reports them', () => {
    const parsed = parseComposition('90% cotton 10% metallic');
    expect(parsed.shell).toContainEqual({ fiber: 'other', percent: 10 });
    expect(parsed.unrecognized).toEqual(['metallic']);
  });

  it('returns an empty, unusable result for text without percentages', () => {
    const parsed = parseComposition('soft and comfy');
    expect(parsed.shell).toEqual([]);
    expect(parsed.usable).toBe(false);
  });
});

describe('normalizeLabelText', () => {
  it('lowercases with Turkish rules and strips diacritics', () => {
    expect(normalizeLabelText('YÜN İPEK Kaşmir')).toBe('yun ipek kasmir');
  });
});

describe('parseComposition – edge cases', () => {
  it.each`
    text                                                         | shell
    ${'COMPOSITION: 80% WOOL, 20% POLYAMIDE'}                    | ${[{ fiber: 'wool', percent: 80 }, { fiber: 'polyamide', percent: 20 }]}
    ${'100%cotton'}                                              | ${[{ fiber: 'cotton', percent: 100 }]}
    ${'Cotton100%'}                                              | ${[{ fiber: 'cotton', percent: 100 }]}
    ${'80 % yün 20 % akrilik'}                                   | ${[{ fiber: 'wool', percent: 80 }, { fiber: 'acrylic', percent: 20 }]}
    ${'80%wool,20%nylon'}                                        | ${[{ fiber: 'wool', percent: 80 }, { fiber: 'nylon', percent: 20 }]}
    ${'wool 80% / nylon 20%'}                                    | ${[{ fiber: 'wool', percent: 80 }, { fiber: 'nylon', percent: 20 }]}
    ${'50% cotton\n50% lin'}                                     | ${[{ fiber: 'cotton', percent: 50 }, { fiber: 'linen', percent: 50 }]}
    ${'%60 Pamuk, %35 Polyester, %5 Elastan'}                    | ${[{ fiber: 'cotton', percent: 60 }, { fiber: 'polyester', percent: 35 }, { fiber: 'elastane', percent: 5 }]}
    ${'Composition: cotton 60%, polyester 40%. Care: wash at 30°'} | ${[{ fiber: 'cotton', percent: 60 }, { fiber: 'polyester', percent: 40 }]}
    ${'%100 LİNEN'}                                              | ${[{ fiber: 'linen', percent: 100 }]}
    ${'ŞERİT: 100% İPEK'}                                        | ${[{ fiber: 'silk', percent: 100 }]}
    ${'70% virgin wool 30% cashmere'}                            | ${[{ fiber: 'wool', percent: 70 }, { fiber: 'cashmere', percent: 30 }]}
    ${'100% recycled polyester'}                                 | ${[{ fiber: 'recycled_polyester', percent: 100 }]}
    ${'100% polyester recyclé'}                                  | ${[{ fiber: 'recycled_polyester', percent: 100 }]}
    ${'PU 100%'}                                                 | ${[{ fiber: 'pu_faux_leather', percent: 100 }]}
    ${'100% cotton (exclusive of trims)'}                        | ${[{ fiber: 'cotton', percent: 100 }]}
  `('reads $text', ({ text, shell }) => {
    expect(parseComposition(text).shell).toEqual(shell);
  });

  it.each`
    text                                                                 | shell                                                                            | lining
    ${'Outer shell: 100% cotton; Lining: 100% silk'}                     | ${[{ fiber: 'cotton', percent: 100 }]}                                           | ${[{ fiber: 'silk', percent: 100 }]}
    ${'Dış: %70 pamuk %30 polyester Astar: %100 polyester'}              | ${[{ fiber: 'cotton', percent: 70 }, { fiber: 'polyester', percent: 30 }]}       | ${[{ fiber: 'polyester', percent: 100 }]}
    ${'Obermaterial: 80% Schurwolle, 20% Polyamid. Futter: 100% Viskose'} | ${[{ fiber: 'wool', percent: 80 }, { fiber: 'polyamide', percent: 20 }]}         | ${[{ fiber: 'viscose', percent: 100 }]}
    ${'Tissu principal : 60 % coton, 40 % polyester Doublure: 100% cupro'} | ${[{ fiber: 'cotton', percent: 60 }, { fiber: 'polyester', percent: 40 }]}      | ${[{ fiber: 'cupro', percent: 100 }]}
    ${'Exterior: 55% algodón 45% poliéster Forro: 100% poliéster'}       | ${[{ fiber: 'cotton', percent: 55 }, { fiber: 'polyester', percent: 45 }]}       | ${[{ fiber: 'polyester', percent: 100 }]}
    ${'Esterno: 70% lana 30% poliammide Fodera: 100% seta'}              | ${[{ fiber: 'wool', percent: 70 }, { fiber: 'polyamide', percent: 30 }]}         | ${[{ fiber: 'silk', percent: 100 }]}
    ${'lining: 100% cupro shell: 100% wool'}                             | ${[{ fiber: 'wool', percent: 100 }]}                                             | ${[{ fiber: 'cupro', percent: 100 }]}
    ${'50% cotton 50% polyester Lining 100% polyester'}                  | ${[{ fiber: 'cotton', percent: 50 }, { fiber: 'polyester', percent: 50 }]}       | ${[{ fiber: 'polyester', percent: 100 }]}
    ${'Shell: 100% nylon. Filling: 90% down, 10% feather. Lining: 100% polyester.'} | ${[{ fiber: 'nylon', percent: 100 }]}                                 | ${[{ fiber: 'polyester', percent: 100 }]}
  `('splits sections in $text', ({ text, shell, lining }) => {
    const parsed = parseComposition(text);
    expect(parsed.shell).toEqual(shell);
    expect(parsed.lining).toEqual(lining);
  });

  it('ignores rib trims so they do not inflate the shell total', () => {
    const parsed = parseComposition('Body: 95% cotton 5% elastane Rib: 98% cotton 2% elastane');
    expect(parsed.shell).toEqual([
      { fiber: 'cotton', percent: 95 },
      { fiber: 'elastane', percent: 5 },
    ]);
    expect(parsed.shellTotalPercent).toBe(100);
  });

  it('merges a fibre that is listed twice', () => {
    expect(parseComposition('40% cotton 20% polyester 40% cotton').shell).toEqual([
      { fiber: 'cotton', percent: 80 },
      { fiber: 'polyester', percent: 20 },
    ]);
  });

  it.each([
    ['94% cotton', true, 100],
    ['95% cotton', false, 95],
    ['105% cotton', false, 105],
    ['106% cotton', true, 100],
  ])('normalisation band edge %s → normalized=%p', (text, normalized, percent) => {
    const parsed = parseComposition(text);
    expect(parsed.normalized).toBe(normalized);
    expect(parsed.shell[0]?.percent).toBe(percent);
  });

  it('normalises totals above 105 % down to 100', () => {
    const parsed = parseComposition('80% wool 40% polyamide');
    expect(parsed.shellTotalPercent).toBe(120);
    expect(parsed.normalized).toBe(true);
    expect(parsed.shell).toEqual([
      { fiber: 'wool', percent: 66.67 },
      { fiber: 'polyamide', percent: 33.33 },
    ]);
  });

  it('treats exactly 50 % as usable and 49.9 % as unusable (and does not normalise it)', () => {
    expect(parseComposition('25% cotton 25% wool').usable).toBe(true);
    const tooLittle = parseComposition('49,9% cotton');
    expect(tooLittle.usable).toBe(false);
    expect(tooLittle.normalized).toBe(false);
    expect(tooLittle.shell).toEqual([{ fiber: 'cotton', percent: 49.9 }]);
  });

  it.each(['', '   ', '!!!@@@###', '%%%%', '100%', 'soft and comfy', 'Made in Türkiye'])('returns an empty unusable result for %p', (text) => {
    const parsed = parseComposition(text);
    expect(parsed.shell).toEqual([]);
    expect(parsed.usable).toBe(false);
    expect(parsed.normalized).toBe(false);
  });

  // Regression: "1000%" used to be read as "000%" → { cotton, 0 }.
  it('drops numbers with more than three digits instead of misreading their tail', () => {
    expect(parseComposition('1000% cotton').shell).toEqual([]);
    expect(parseComposition('%1000 pamuk').shell).toEqual([]);
    expect(parseComposition('1000% cotton 100% wool').shell).toEqual([{ fiber: 'wool', percent: 100 }]);
  });

  it('counts unknown words in fibre-first labels as other', () => {
    const parsed = parseComposition('cotton 90%, lurex 10%');
    expect(parsed.shell).toEqual([
      { fiber: 'cotton', percent: 90 },
      { fiber: 'other', percent: 10 },
    ]);
    expect(parsed.unrecognized).toEqual(['lurex']);
  });

  it('marks a mostly unknown label as unusable only when known + other < 50', () => {
    // Unknown fibres still count as "other" towards the total, so this is usable but mostly "other".
    const parsed = parseComposition('60% mystery 40% cotton');
    expect(parsed.usable).toBe(true);
    expect(parsed.shell[0]).toEqual({ fiber: 'other', percent: 60 });
  });
});
