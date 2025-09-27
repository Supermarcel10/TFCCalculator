import {ICalculationService, OutputCode} from "@/services/calculation/abstract/ICalculationService";
import {CalculationService} from "@/services/calculation/CalculationService";
import {IStrategySelector} from "@/services/calculation/abstract/IStrategySelector";
import {IConstraintChecker} from "@/services/calculation/abstract/IConstraintChecker";
import {ConstraintChecker} from "@/services/calculation/ConstraintChecker";
import {StrategySelector} from "@/services/calculation/StrategySelector";
import {bronzeComponents} from "@test/helpers/reusableFixtureData";
import {AvailableMineralBuilder} from "@test/helpers/availableMineralBuilder";

// TODO: Proper mocks
let constraintChecker : IConstraintChecker;
let strategySelector : IStrategySelector;
let sut : ICalculationService

beforeAll(() => {
	constraintChecker = new ConstraintChecker();
	strategySelector = new StrategySelector();

	sut = new CalculationService(
			constraintChecker,
			strategySelector
	);
});

// TODO: Filter and remove tests that are no longer valid/required
describe("OutputCalculator — bronzeComponents() in mB scale (16/24/36)", () => {
  it('Exact minerals -> success @ 432 mB', () => {
	  // arrange
	  const availableMinerals = AvailableMineralBuilder
			  .create()
			  .add("tin", 16, 3)
			  .add("copper", 24, 7)
			  .add("copper", 36, 6)
			  .build();

	  // act
	  const result = sut.calculateSmeltingOutput(432, bronzeComponents(), availableMinerals);

	  // assert
    expect(result.status).toBe(OutputCode.SUCCESS);
    expect(result.amountMb).toBe(432);

	  const usedMineralsTotalMb = result.usedMinerals.reduce((s, u) => s + u.yield * u.quantity, 0);
	  expect(usedMineralsTotalMb).toBe(432);
  });

  it('More than enough minerals -> success with correct ratios', () => {
	  // arrange
	  const availableMinerals = AvailableMineralBuilder
			  .create()
			  .add("tin", 16, 50)
			  .add("copper", 24, 70)
			  .add("copper", 36, 60)
			  .build();

	  // act
	  const result = sut.calculateSmeltingOutput(432, bronzeComponents(), availableMinerals);

	  // assert
	  expect(result.status).toBe(OutputCode.SUCCESS);

	  const tinCopperMb = result.usedMinerals
	                            .filter(qm => qm.produces === "tin")
	                            .reduce((sum, qm) => sum + qm.yield * qm.quantity, 0);
	  const tinPercent = (tinCopperMb / result.amountMb) * 100;
	  expect(tinPercent).toBeGreaterThanOrEqual(8);
	  expect(tinPercent).toBeLessThanOrEqual(12);

	  const copperTotalMb = result.usedMinerals
	                              .filter(qm => qm.produces === "copper")
	                              .reduce((sum, qm) => sum + qm.yield * qm.quantity, 0);
	  const copperPercent = (copperTotalMb / result.amountMb) * 100;
	  expect(copperPercent).toBeGreaterThanOrEqual(88);
	  expect(copperPercent).toBeLessThanOrEqual(92);
  });

  it('Irrelevant minerals present -> still succeeds @ 432 mB', () => {
	  // arrange
	  const availableMinerals = AvailableMineralBuilder
			  .create()
			  .add("tin", 16, 3)
			  .add("copper", 24, 7)
			  .add("copper", 36, 6)
			  .addNoise()
			  .build();

	  // act
	  const result = sut.calculateSmeltingOutput(432, bronzeComponents(), availableMinerals);

	  // assert
	  expect(result.status).toBe(OutputCode.SUCCESS);
	  expect(result.amountMb).toBe(432);
  });

  it('Not enough total mineral -> fails with message', () => {
	  // arrange
	  const availableMinerals = AvailableMineralBuilder
			  .create()
			  .add("tin", 16, 2)
			  .add("copper", 24, 7)
			  .add("copper", 36, 6)
			  .build();

	  // act
	  const result = sut.calculateSmeltingOutput(432, bronzeComponents(), availableMinerals);

	  // assert
	  expect(result.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
	  expect(result.statusContext).toContain("Not enough total material available");
  });

	it("Impossible ratio with high yield piece sizes -> fails with combination message", () => {
		// arrange
		const availableMinerals = AvailableMineralBuilder
				.create()
				.add("tin", 48, 4)
				.add("copper", 72, 6)
				.build();

		// act
		const result = sut.calculateSmeltingOutput(432, bronzeComponents(), availableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.UNFEASIBLE);
		expect(result.statusContext).toContain("Could not find valid combination of materials");
  });
});
