import {OutputCalculator, OutputCode}                                   from "@/functions/algorithm"
import {SmeltingComponent}                                              from "@/types"
import {bronzeComponents, byTypeMap, create_quantified_mineral, timeIt} from "./helpers"


const bronze: SmeltingComponent[] = bronzeComponents();
let sut: OutputCalculator;

beforeAll(() => {
  sut = new OutputCalculator();
});

describe('OutputCalculator - smoke & micro-bench', () => {
  it('Large quantities, few variants -> stays fast', () => {
    const target = 4320; // ~10x the base 432 mB case
    const inv = byTypeMap([
      ['tin',    [create_quantified_mineral('Small Tin', 'tin', 16, 200)]], // 3200 mB tin
      ['copper', [create_quantified_mineral('Med Cu',    'copper', 24, 400),
                  create_quantified_mineral('Large Cu',  'copper', 36, 300)]], // 20400 mB copper
    ]);

    const { result, ms } = timeIt(() => sut.calculateSmeltingOutput(target, bronze, inv));
    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(ms).toBeLessThan(400);
    // eslint-disable-next-line no-console
    console.info(`[bench] large-qty few-variants: ${ms.toFixed(1)} ms`);
  });

  it('Many variants per type (large, fragmented inventory)', () => {
    const target = 1440;
    const tinVars = Array.from({ length: 18 }, (_, i) =>
      create_quantified_mineral(`Tin v${i}`, 'tin', 16, 5 + (i % 4))
    );
    const cuVars = Array.from({ length: 24 }, (_, i) =>
      create_quantified_mineral(`Cu v${i}`, 'copper', i % 2 ? 24 : 36, 6 + (i % 5))
    );
    const inv = byTypeMap([
      ['tin', tinVars],
      ['copper', cuVars],
    ]);

    const { result, ms } = timeIt(() => sut.calculateSmeltingOutput(target, bronze, inv));
    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(ms).toBeLessThan(600);
    // eslint-disable-next-line no-console
    console.info(`[bench] many-variants: ${ms.toFixed(1)} ms`);
  });

  it('Large + many combined (stress test)', () => {
    const target = 2880;
    const tinVars = Array.from({ length: 16 }, (_, i) =>
      create_quantified_mineral(`Tin v${i}`, 'tin', 16, 30 + (i % 7))
    );
    const cuVars = Array.from({ length: 20 }, (_, i) =>
      create_quantified_mineral(`Cu v${i}`, 'copper', i % 2 ? 24 : 36, 40 + (i % 9))
    );
    const inv = byTypeMap([
      ['tin', tinVars],
      ['copper', cuVars],
    ]);

    const { result, ms } = timeIt(() => sut.calculateSmeltingOutput(target, bronze, inv));
    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(ms).toBeLessThan(1200);
    // eslint-disable-next-line no-console
    console.info(`[bench] large+many: ${ms.toFixed(1)} ms`);
  });
});
