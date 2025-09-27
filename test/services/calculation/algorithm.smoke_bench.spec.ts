import {ICalculationService, OutputCode} from "@/services/calculation/abstract/ICalculationService";
import {IConstraintChecker} from "@/services/calculation/abstract/IConstraintChecker";
import {IStrategySelector} from "@/services/calculation/abstract/IStrategySelector";
import {CalculationService} from "@/services/calculation/CalculationService";
import {StrategySelector} from "@/services/calculation/StrategySelector";
import {ConstraintChecker} from "@/services/calculation/ConstraintChecker";
import {bronzeComponents} from "@test/helpers/reusableFixtureData";
import {AvailableMineralBuilder} from "@test/helpers/availableMineralBuilder";


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


describe("OutputCalculator - smoke & micro-bench", () => {
	it("Large quantities, few variants -> stays fast", () => {
		// arrange
		const targetMb = 4320;
		const availableMinerals = AvailableMineralBuilder
				.create()
				.add("tin", 16, 200)
				.add("copper", 24, 400)
				.add("copper", 36, 300)
				.build();

		// act
		const result = sut.calculateSmeltingOutput(targetMb, bronzeComponents(), availableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.SUCCESS);
	});

	it("Many variants per type (large, fragmented inventory)", () => {
		// arrange
		const targetMb = 1440;
		const availableMinerals = AvailableMineralBuilder
				.create()
				.addVariants("tin")
				.addVariants("copper")
				.build();

		// act
		const result = sut.calculateSmeltingOutput(targetMb, bronzeComponents(), availableMinerals);

		// assert
		expect(result.status).toBe(OutputCode.SUCCESS);
	});

	it("Large + many combined (stress test)", () => {
		// arrange
		const targetMb = 2880;
		const availableMinerals = AvailableMineralBuilder
				.create()
				.addVariants("tin")
				.addVariants("copper")
				.build();

		// act
		const result = sut.calculateSmeltingOutput(targetMb, bronzeComponents(), availableMinerals);

		// arrange
		expect(result.status).toBe(OutputCode.SUCCESS);
	});
});
