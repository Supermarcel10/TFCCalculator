import {ICalculationService, OutputCode} from "@/services/calculation/abstract/ICalculationService";
import {CalculationService} from "@/services/calculation/CalculationService";
import {SmeltingComponent} from "@/types";
import {StrategySelector} from "@/services/calculation/StrategySelector";
import {ConstraintChecker} from "@/services/calculation/ConstraintChecker";
import {IStrategySelector} from "@/services/calculation/abstract/IStrategySelector";
import {IConstraintChecker} from "@/services/calculation/abstract/IConstraintChecker";
import {bronzeComponents} from "@test/helpers/reusableFixtureData";
import {faker} from "@faker-js/faker";
import {AvailableMineralBuilder} from "@test/helpers/availableMineralBuilder";
import {availableMineralsFixture} from "@test/fixtures/availableMineralFixture";


// TODO: Proper mocks
let constraintChecker : IConstraintChecker;
let strategySelector : IStrategySelector;
let sut : ICalculationService;

beforeAll(() => {
	constraintChecker = new ConstraintChecker();
	strategySelector = new StrategySelector();

	sut = new CalculationService(
			constraintChecker,
			strategySelector
	);
});

// TODO: Filter and remove tests that are no longer valid/required
describe("OutputCalculator - failure & edge cases", () => {
	it("Conflicting percentage windows (mins add to > 100%) -> UNSAT by combination", () => {
		// arrange
		const mineralA = faker.string.alphanumeric();
		const mineralB = faker.string.alphanumeric();

		const badAlloy : SmeltingComponent[] = [
			{mineral : mineralA, min : 60, max : 100},
			{mineral : mineralB, min : 50, max : 100}
		];

		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.calculateSmeltingOutput(100, badAlloy, fixtureAvailableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.UNFEASIBLE);
		expect(result.statusContext).toContain("Could not find valid combination of materials");
	});

	it("Conflicting percentage windows (maxes sum < 100%) -> UNSAT by combination", () => {
		// arrange
		const mineralA = faker.string.alphanumeric();
		const mineralB = faker.string.alphanumeric();

		const badAlloy : SmeltingComponent[] = [
			{mineral : mineralA, min : 0, max : 40},
			{mineral : mineralB, min : 0, max : 30}
		];

		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.calculateSmeltingOutput(100, badAlloy, fixtureAvailableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.UNFEASIBLE);
		expect(result.statusContext).toContain("Could not find valid combination of materials");
	});

	it("Boundary acceptance: exact 8% tin is allowed", () => {
		// arrange
		const availableMinerals = AvailableMineralBuilder
				.create()
				.add("tin", 16, 2)
				.add("copper", 16, 23)
				.build();

		// act
		const result = sut.calculateSmeltingOutput(400, bronzeComponents(), availableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.SUCCESS);
		expect(result.amountMb).toBe(400);
	});
});
