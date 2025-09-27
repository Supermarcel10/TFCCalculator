import {OutputCalculator, OutputCode}                                              from "@/functions/algorithm"
import {SmeltingComponent}                                                         from "@/types"
import {bronzeComponents, byTypeMap, create_quantified_mineral, timeIt, totalUsed} from "./helpers"


const bronze: SmeltingComponent[] = bronzeComponents();
let sut: OutputCalculator;

beforeAll(() => {
  sut = new OutputCalculator();
});

describe('OutputCalculator — bronze in mB scale (16/24/36)', () => {
  it('Exact minerals -> success @ 432 mB', () => {
    // tin: 3×16 = 48; copper: 7×24 + 6×36 = 384; total = 432
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 3)]],
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 7),
                  create_quantified_mineral('Large Copper',      'copper', 36, 6)]],
    ]);

    const { result, ms } = timeIt(() =>
      sut.calculateSmeltingOutput(432, bronze, inv)
    );
    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(result.amountMb).toBe(432);
    expect(totalUsed(result.usedMinerals)).toBe(432);

    // light performance guard
    expect(ms).toBeLessThan(100);
  });

  it('More than enough minerals -> success with correct ratios', () => {
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin',    16, 50)]],
      ['copper', [create_quantified_mineral('Medium Copper',     'copper', 24, 70),
                  create_quantified_mineral('Large Copper',      'copper', 36, 60)]],
    ]);

    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.SUCCESS);
    // Sanity check: tin between 8–12%
    const tin = res.usedMinerals.filter(u => u.produces === 'tin')
      .reduce((s, u) => s + u.yield * u.quantity, 0);
    const pctTin = (tin / res.amountMb) * 100;
    expect(pctTin).toBeGreaterThanOrEqual(8);
    expect(pctTin).toBeLessThanOrEqual(12);

    // Sanity check: copper between 88-92%
    const copper = res.usedMinerals.filter(u => u.produces === 'copper')
      .reduce((s, u) => s + u.yield * u.quantity, 0);
    const pctCopper = (copper / res.amountMb) * 100;
    expect(pctCopper).toBeGreaterThanOrEqual(88);
    expect(pctCopper).toBeLessThanOrEqual(92);
  });

  it('Irrelevant minerals present -> still succeeds @ 432 mB', () => {
    const inv = byTypeMap([
      // required types
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin', 16, 3)]],
      ['copper', [create_quantified_mineral('Medium Copper', 'copper', 24, 7), create_quantified_mineral('Large Copper', 'copper', 36, 6)]],
      // extras (ignored)
      ['iron',   [create_quantified_mineral('Hematite', 'iron', 24, 3)]],
      ['silver', [create_quantified_mineral('Silver Ore', 'silver', 36, 2)]],
      ['lead',   [create_quantified_mineral('Lead Ore', 'lead', 48, 3)]],
    ]);

    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.SUCCESS);
    expect(res.amountMb).toBe(432);
  });

  it('Not enough total mineral -> fails with message', () => {
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin', 16, 2)]], // only 32 mB tin
      ['copper', [create_quantified_mineral('Medium Copper', 'copper', 24, 7),
                  create_quantified_mineral('Large Copper',  'copper', 36, 6)]], // 384 mB copper
    ]);
    // 32 + 384 = 416 < 432 -> total mB insufficient
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
    expect(res.statusContext).toContain('Not enough total material available');
  });

  it('Enough total, but per-type minimum unmet -> fails with per-type message', () => {
    // Copper too low for 88% min at 432 mB
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin', 16, 32)]], // 512 mB tin (signficantly too much)
      ['copper', [create_quantified_mineral('Medium Copper', 'copper', 24, 2), create_quantified_mineral('Large Copper', 'copper', 36, 2)]], // 120 mB copper
      // For 432 mB bronze, we need at least 380mB copper (88% of 432)
      // Check for minimum required copper fails
    ]);
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB);
    expect(res.statusContext?.toLowerCase()).toContain('not enough copper');
  });

  it('Impossible ratio with coarse piece sizes -> fails with combination message', () => {
    // "Coarse" refers to minerals with high yields, i.e. unfavourable increments
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Large Tin',   'tin',    48, 4)]], // 0, 48, 96, 144, 192
      ['copper', [create_quantified_mineral('Large Copper','copper', 72, 6)]], // 0, 72, 144, 216, 288, 360, 432
      // For bronze window, tin must be between 8% and 12% of total -> [34.56, 51.84]
      // only 48 mB tin is valid for 8-12%. However, 384 mB copper is required, but impossible
    ]);
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.UNFEASIBLE);
    expect(res.statusContext).toContain('Could not find valid combination of materials');
  });
});
