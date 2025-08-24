import { calculateMetal } from '@/functions/algorithm';
import type { SmeltingComponent } from '@/types';
import { qm, byTypeMap, bronzeComponents, timeIt } from './helpers';

/**
 * Computes the total output in mB from a set of used minerals.
 * @param units - an array of objects containing mineral.yield and quantity
 * @returns total produced mB from all minerals
 */
function totalUsed(units: { mineral: { yield: number }, quantity: number }[]) {
  return units.reduce((s, u) => s + u.mineral.yield * u.quantity, 0);
}

describe('calculateMetal — bronze in mB scale (16/24/36)', () => {
  const bronze: SmeltingComponent[] = bronzeComponents();

  it('Exact minerals -> success @ 432 mB', () => {
    // tin: 3×16 = 48; copper: 7×24 + 6×36 = 384; total = 432
    const inv = byTypeMap([
      ['tin',    [qm('Small Cassiterite', 'tin',    16, 3)]],
      ['copper', [qm('Medium Copper',     'copper', 24, 7),
                  qm('Large Copper',      'copper', 36, 6)]],
    ]);

    const { result, ms } = timeIt(() =>
      calculateMetal(432, bronze, inv)
    );
    expect(result.success).toBe(true);
    expect(result.outputMb).toBe(432);
    expect(totalUsed(result.usedMinerals)).toBe(432);

    // soft performance guard
    expect(ms).toBeLessThan(100);
  });

  // TODO: Algorithm requires backtracking. Incorrectly returns no valid combination
  it.skip('More than enough minerals -> success with correct ratios', () => {
    const inv = byTypeMap([
      ['tin',    [qm('Small Cassiterite', 'tin',    16, 50)]],
      ['copper', [qm('Medium Copper',     'copper', 24, 70),
                  qm('Large Copper',      'copper', 36, 60)]],
    ]);

    const res = calculateMetal(432, bronze, inv);
    expect(res.success).toBe(true);
    // Sanity check: tin between 8–12%
    const tin = res.usedMinerals.filter(u => u.mineral.produces === 'tin')
      .reduce((s, u) => s + u.mineral.yield * u.quantity, 0);
    const pctTin = (tin / res.outputMb) * 100;
    expect(pctTin).toBeGreaterThanOrEqual(8);
    expect(pctTin).toBeLessThanOrEqual(12);
  });

  it('Irrelevant minerals present -> still succeeds @ 432 mB', () => {
    const inv = byTypeMap([
      // required types
      ['tin',    [qm('Small Cassiterite', 'tin', 16, 3)]],
      ['copper', [qm('Medium Copper', 'copper', 24, 7), qm('Large Copper', 'copper', 36, 6)]],
      // extras (ignored)
      ['iron',   [qm('Hematite', 'iron', 24, 3)]],
      ['silver', [qm('Silver Ore', 'silver', 36, 2)]],
      ['lead',   [qm('Lead Ore', 'lead', 48, 3)]],
    ]);

    const res = calculateMetal(432, bronze, inv);
    expect(res.success).toBe(true);
    expect(res.outputMb).toBe(432);
  });

  it('Not enough total mineral -> fails with message', () => {
    const inv = byTypeMap([
      ['tin',    [qm('Small Cassiterite', 'tin', 16, 2)]], // only 32 mB tin
      ['copper', [qm('Medium Copper', 'copper', 24, 7),
                  qm('Large Copper',  'copper', 36, 6)]], // 384 mB copper
    ]);
    // 32 + 384 = 416 < 432 -> total mB insufficient
    const res = calculateMetal(432, bronze, inv);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Not enough total material available');
  });

  it('Enough total, but per-type minimum unmet -> fails with per-type message', () => {
    // Copper too low for 88% min at 432 mB
    const inv = byTypeMap([
      ['tin',    [qm('Small Cassiterite', 'tin', 16, 32)]], // 512 mB tin (signficantly too much)
      ['copper', [qm('Medium Copper', 'copper', 24, 2), qm('Large Copper', 'copper', 36, 2)]], // 120 mB copper
      // For 432 mB bronze, we need at least 380mB copper (88% of 432)
      // Check for minimum required copper fails
    ]);
    const res = calculateMetal(432, bronze, inv);
    expect(res.success).toBe(false);
    expect(res.message?.toLowerCase()).toContain('not enough copper');
  });

  it('Impossible ratio with coarse piece sizes -> fails with combination message', () => {
    // "Coarse" refers to minerals with high yields, i.e. unfavourable increments
    const inv = byTypeMap([
      ['tin',    [qm('Large Tin',   'tin',    48, 4)]], // 0, 48, 96, 144, 192
      ['copper', [qm('Large Copper','copper', 72, 6)]], // 0, 72, 144, 216, 288, 360, 432
      // For bronze window, tin must be between 8% and 12% of total -> [34.56, 51.84]
      // only 48 mB tin is valid for 8-12%. However, 384 mB copper is required, but impossible
    ]);
    const res = calculateMetal(432, bronze, inv);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Could not find valid combination of materials');
  });
});
