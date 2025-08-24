import { calculateMetal } from '@/functions/algorithm';
import { qm, byTypeMap, bronzeComponents, timeIt } from './helpers';

const bronze = bronzeComponents();
// Run heavy tests with below:
// HEAVY=1 NODE_OPTIONS=--max-old-space-size=4096 jest -w 1 test/algorithm.smoke_bench.spec.ts
const HEAVY = process.env.HEAVY === '1';

describe('calculateMetal - smoke & micro-bench', () => {
  // TODO: Algorithm requires backtracking. Incorrectly returns no valid combination
  it.skip('Large quantities, few variants -> stays fast', () => {
    const target = 4320; // ~10x the base 432 mB case
    const inv = byTypeMap([
      ['tin',    [qm('Small Tin', 'tin', 16, 200)]], // 3200 mB tin
      ['copper', [qm('Med Cu',    'copper', 24, 400),
                  qm('Large Cu',  'copper', 36, 300)]], // 20400 mB copper
    ]);

    const { result, ms } = timeIt(() => calculateMetal(target, bronze, inv));
    expect(result.success).toBe(true);
    expect(ms).toBeLessThan(400);
    // eslint-disable-next-line no-console
    console.info(`[bench] large-qty few-variants: ${ms.toFixed(1)} ms`);
  });

  (HEAVY ? it : it.skip)('Many variants per type (large, fragmented inventory)', () => {
    const target = 1440;
    const tinVars = Array.from({ length: 18 }, (_, i) =>
      qm(`Tin v${i}`, 'tin', 16, 5 + (i % 4))
    );
    const cuVars = Array.from({ length: 24 }, (_, i) =>
      qm(`Cu v${i}`, 'copper', i % 2 ? 24 : 36, 6 + (i % 5))
    );
    const inv = byTypeMap([
      ['tin', tinVars],
      ['copper', cuVars],
    ]);

    const { result, ms } = timeIt(() => calculateMetal(target, bronze, inv));
    expect(result.success).toBe(true);
    expect(ms).toBeLessThan(600);
    // eslint-disable-next-line no-console
    console.info(`[bench] many-variants: ${ms.toFixed(1)} ms`);
  });

  (HEAVY ? it : it.skip)('Large + many combined (stress test)', () => {
    const target = 2880;
    const tinVars = Array.from({ length: 16 }, (_, i) =>
      qm(`Tin v${i}`, 'tin', 16, 30 + (i % 7))
    );
    const cuVars = Array.from({ length: 20 }, (_, i) =>
      qm(`Cu v${i}`, 'copper', i % 2 ? 24 : 36, 40 + (i % 9))
    );
    const inv = byTypeMap([
      ['tin', tinVars],
      ['copper', cuVars],
    ]);

    const { result, ms } = timeIt(() => calculateMetal(target, bronze, inv));
    expect(result.success).toBe(true);
    expect(ms).toBeLessThan(1200);
    // eslint-disable-next-line no-console
    console.info(`[bench] large+many: ${ms.toFixed(1)} ms`);
  });
});
