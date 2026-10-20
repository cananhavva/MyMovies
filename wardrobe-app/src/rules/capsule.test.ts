import { makeGarment } from '@/testing/fixtures';
import { buildCapsulePlan, CAPSULE_CORE, capsuleCoverage } from './capsule';

describe('capsule', () => {
  it('reports every core piece as missing for an empty wardrobe', () => {
    expect(capsuleCoverage([]).missingSpecs).toHaveLength(CAPSULE_CORE.length);
  });

  it('uses each garment for one slot only', () => {
    const whiteTee = makeGarment({ id: 'tee', category: 'top', subcategory: 't_shirt', colors: ['white'] });
    const coverage = capsuleCoverage([whiteTee]);
    expect(coverage.coreGarmentIds).toEqual(['tee']);
    expect(coverage.missingSpecs).toHaveLength(CAPSULE_CORE.length - 1);
  });

  it('accepts alternatives such as boots for the loafer slot', () => {
    const boots = makeGarment({ id: 'boots', category: 'shoes', subcategory: 'boots', colors: ['brown'] });
    expect(capsuleCoverage([boots]).coreGarmentIds).toEqual(['boots']);
  });

  it('builds a plan with gap keys', () => {
    const plan = buildCapsulePlan({ id: 'p1', garments: [], season: 'autumn', now: new Date('2026-10-01T00:00:00Z') });
    expect(plan.targetSize).toBe(14);
    expect(plan.gapKeys).toContain('outerwear:trench_coat:any');
    expect(plan.gapKeys).toContain('top:shirt:white');
  });
});
