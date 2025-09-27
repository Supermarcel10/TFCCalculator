import {ICalculationService, OutputCode}                                   from "@/services/calculation/abstract/ICalculationService"
import {
  CalculationService
}                                                                          from "@/services/calculation/CalculationService"
import {SmeltingComponent}                                                 from "@/types"
import {bronzeComponents, byTypeMap, create_quantified_mineral, totalUsed} from "./helpers"


const bronze: SmeltingComponent[] = bronzeComponents();
let sut : ICalculationService

beforeAll(() => {
  sut = new CalculationService()
});

describe('OutputCalculator - failure & edge cases', () => {
  it('No minerals at all -> not enough total material available', () => {
    const inv = byTypeMap([]);
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
    expect(res.statusContext).toContain('Not enough total material available');
  });

  it('Required component key missing in map -> not enough <type> for minimum requirement', () => {
    // Copper present, tin missing entirely
    const inv = byTypeMap([
      ['copper', [create_quantified_mineral('Medium Copper', 'copper', 24, 100)]],
    ]);
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB);
    expect(res.statusContext?.toLowerCase()).toContain('not enough tin');
  });

  it('Conflicting percentage windows (mins add to > 100%) -> UNSAT by combination', () => {
    // Create impossible ratios for smelting component
    const badAlloy: SmeltingComponent[] = [
      { mineral: 'a', min: 60, max: 100 },
      { mineral: 'b', min: 50, max: 100 },
    ];
    const inv = byTypeMap([
      ['a', [create_quantified_mineral('A1', 'a', 10, 100)]],
      ['b', [create_quantified_mineral('B1', 'b', 10, 100)]],
    ]);
    const res = sut.calculateSmeltingOutput(100, badAlloy, inv);
    expect(res.status).toBe(OutputCode.UNFEASIBLE);
    expect(res.statusContext).toContain('Could not find valid combination of materials');
  });

  it('Conflicting percentage windows (maxes sum < 100%) -> UNSAT by combination', () => {
    // Create impossible ratios for smelting component
    const badAlloy: SmeltingComponent[] = [
      { mineral: 'a', min: 0,  max: 40 },
      { mineral: 'b', min: 0,  max: 30 },
    ];
    const inv = byTypeMap([
      ['a', [create_quantified_mineral('A1', 'a', 10, 100)]],
      ['b', [create_quantified_mineral('B1', 'b', 10, 100)]],
    ]);
    const res = sut.calculateSmeltingOutput(100, badAlloy, inv);
    expect(res.status).toBe(OutputCode.UNFEASIBLE);
    expect(res.statusContext).toContain('Could not find valid combination of materials');
  });

  it('Boundary acceptance: exact 8% tin is allowed', () => {
    // target 400; tin=32 (8%), copper=368 (92%)
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Tiny Tin',    'tin',    16, 2)]],   // 32
      ['copper', [create_quantified_mineral('Copper 16u',  'copper', 16, 23)]],  // 368
    ]);
    const res = sut.calculateSmeltingOutput(400, bronze, inv);
    expect(res.status).toBe(OutputCode.SUCCESS);
    expect(res.amountMb).toBe(400);
    expect(totalUsed(res.usedMinerals)).toBe(400);
  });

  it('Map key case-insensitivity (helpers lower-case keys) -> still succeeds', () => {
    // byTypeMap lower-cases keys + qm lower-cases produces -> should work
    const inv = byTypeMap([
      ['Tin',    [create_quantified_mineral('Small Cassiterite', 'TIN',    16, 3)]],
      ['Copper', [create_quantified_mineral('Medium Copper',     'Copper', 24, 7),
                  create_quantified_mineral('Large Copper',      'cOpPeR', 36, 6)]],
    ]);
    const res = sut.calculateSmeltingOutput(432, bronze, inv);
    expect(res.status).toBe(OutputCode.SUCCESS);
    expect(res.amountMb).toBe(432);
  });

  it('Component order robustness for a known feasible case', () => {
    // robustness/invariance check: verifies that a known-feasible bronze request succeeds '
    // regardless of the order of the alloy components array
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Cassiterite', 'tin', 16, 3)]],
      ['copper', [create_quantified_mineral('Medium Copper', 'copper', 24, 7), create_quantified_mineral('Large Copper', 'copper', 36, 6)]],
    ]);
    const bronze1 = bronze;
    const bronze2 = [bronze[1], bronze[0]]; // swap order
    expect(sut.calculateSmeltingOutput(432, bronze1, inv).status).toBe(OutputCode.SUCCESS);
    expect(sut.calculateSmeltingOutput(432, bronze2, inv).status).toBe(OutputCode.SUCCESS);
  });
});
