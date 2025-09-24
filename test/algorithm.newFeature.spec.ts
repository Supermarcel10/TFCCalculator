import { OutputCalculator, OutputCode, Flags } from '@/functions/algorithm';
import { SmeltingComponent } from '@/types';
import { create_quantified_mineral, byTypeMap, bronzeComponents, totalUsed, timeIt } from './helpers';

const bronze: SmeltingComponent[] = bronzeComponents();
let sut: OutputCalculator;

beforeAll(() => {
  sut = new OutputCalculator();
});

describe('OutputCalculator — closest alternative (bronze; 16/24/36 mB pieces)', () => {
  it('Flag OFF + insufficient total -> INSUFFICIENT_TOTAL_MB (no fallback)', () => {
    // Inventory totals: tin 32 mB (2×16), copper 336 mB (8×24 + 4×36) => 368 mB total (< 432)
    // Without the flag, we fail early on total stock.
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 2)]], // 32
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 8),
                  create_quantified_mineral('Large Copper',      'copper', 36, 4)]], // 336
    ]);

    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
    expect(res.statusContext).toContain('Not enough total material available');
  });

  it('Flag ON + valid interval -> falls back to closest feasible @ 368 mB', () => {
    // Same inventory as above:
    // - Exact 432 is impossible (tin only 32 mB < ceil(0.08 * 432) = 35; and copper counts forbid 384 with given mix)
    // - 368 is feasible: tin 32 mB (≈8.7%) + copper 336 mB, within the 8–12% / 88–92% windows.
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 2)]], // 32
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 8),
                  create_quantified_mineral('Large Copper',      'copper', 36, 4)]], // 336
    ]);

    const { result, ms } = timeIt(() =>
      sut.calculateSmeltingOutput(432, bronze, inv, Flags.CLOSEST_ALTERNATIVE, { intervalMb: 16 })
    );

    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(result.amountMb).toBe(368);
    expect(totalUsed(result.usedMinerals)).toBe(368);
    expect(result.statusContext).toBe('closest_alternative');

    // Ratio sanity checks
    const tinMb = result.usedMinerals
      .filter(u => u.produces === 'tin')
      .reduce((s, u) => s + u.yield * u.quantity, 0);
    const copperMb = result.usedMinerals
      .filter(u => u.produces === 'copper')
      .reduce((s, u) => s + u.yield * u.quantity, 0);

    const pctTin = (tinMb / result.amountMb) * 100;
    const pctCopper = (copperMb / result.amountMb) * 100;
    expect(pctTin).toBeGreaterThanOrEqual(8);
    expect(pctTin).toBeLessThanOrEqual(12);
    expect(pctCopper).toBeGreaterThanOrEqual(88);
    expect(pctCopper).toBeLessThanOrEqual(92);

    // Light perf guard (closest path still fast)
    expect(ms).toBeLessThan(150);
  });

  it('Flag ON but interval missing — exact is possible -> returns exact SUCCESS', () => {
    // This inventory can craft exactly 432 mB (your “exact minerals” case)
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 3)]], // 48
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 7),
                  create_quantified_mineral('Large Copper',      'copper', 36, 6)]], // 384
    ]);

    const res = sut.calculateSmeltingOutput(
      432,
      bronze,
      inv,
      Flags.CLOSEST_ALTERNATIVE,
      undefined as any // no interval needed because exact is reachable
    );

    expect(res.status).toBe(OutputCode.SUCCESS);
    expect(res.amountMb).toBe(432);
    expect(totalUsed(res.usedMinerals)).toBe(432);
    expect(res.statusContext).toBeUndefined(); // exact path, no "closest_alternative"
  });

  it('Flag ON + interval missing/invalid — exact is impossible -> BAD_REQUEST', () => {
    // Inventory totals 368 mB max; exact 432 is impossible.
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 2)]], // 32
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 8),
                  create_quantified_mineral('Large Copper',      'copper', 36, 4)]], // 336
    ]);

    // Missing intervalMb -> should error because we need the fallback path but can't step
    let res = sut.calculateSmeltingOutput(
      432,
      bronze,
      inv,
      Flags.CLOSEST_ALTERNATIVE,
      undefined as any
    );
    expect(res.status).toBe(OutputCode.BAD_REQUEST);
    expect(res.statusContext?.toLowerCase()).toContain('intervalmb');

    // Invalid intervalMb (0) -> also BAD_REQUEST
    res = sut.calculateSmeltingOutput(
      432,
      bronze,
      inv,
      Flags.CLOSEST_ALTERNATIVE,
      { intervalMb: 0 }
    );
    expect(res.status).toBe(OutputCode.BAD_REQUEST);
    expect(res.statusContext?.toLowerCase()).toContain('intervalmb');
  });

  it('Respects interval size: coarse interval can skip feasible totals', () => {
    // With this inventory the best feasible total is 368.
    // If we set interval=100, the algorithm will try 300, 200, 100... and miss 368 entirely.
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 2)]], // 32
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 8),
                  create_quantified_mineral('Large Copper',      'copper', 36, 4)]], // 336
    ]);

    const res = sut.calculateSmeltingOutput(
      432,
      bronze,
      inv,
      Flags.CLOSEST_ALTERNATIVE,
      { intervalMb: 100 }
    );

    expect(res.status).toBe(OutputCode.UNFEASIBLE);
    expect(res.statusContext).toMatch(/no valid combination|could not find valid combination/i);
  });
});
