import {IConstraintChecker} from "@/services/calculation/abstract/IConstraintChecker";
import {ConstraintChecker} from "@/services/calculation/ConstraintChecker";
import {OutputCode} from "@/services/calculation/abstract/ICalculationService";
import {smeltingComponentArrayFixture} from "@test/fixtures/smeltingComponentFixture";
import {availableMineralsFixture} from "@test/fixtures/availableMineralFixture";
import {faker} from "@faker-js/faker";
import {SmeltingComponent} from "@/types";
import {bronzeComponents} from "@test/services/calculation/helpers";
import {AvailableMineralBuilder} from "@test/services/calculation/availableMineralBuilder";


let sut : IConstraintChecker;

beforeAll(() => {
	sut = new ConstraintChecker();
});

describe("checkEntryConstraints", () => {
	it("should return BAD_REQUEST, when targetMb is negative", () => {
		// arrange
		const targetMb = -1;

		const fixtureComponents = smeltingComponentArrayFixture();
		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				fixtureComponents,
				fixtureAvailableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.BAD_REQUEST);
		expect(result.statusContext).toBe("Parameter targetMb must be a positive integer");
	});

	it("should return BAD_REQUEST, when targetMb is 0", () => {
		// arrange
		const targetMb = 0;

		const fixtureComponents = smeltingComponentArrayFixture();
		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				fixtureComponents,
				fixtureAvailableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.BAD_REQUEST);
		expect(result.statusContext).toBe("Parameter targetMb must be a positive integer");
	});

	it("should return BAD_REQUEST, when targetMb is not an integer", () => {
		// arrange
		const targetMb = 0.0;

		const fixtureComponents = smeltingComponentArrayFixture();
		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				fixtureComponents,
				fixtureAvailableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.BAD_REQUEST);
		expect(result.statusContext).toBe("Parameter targetMb must be a positive integer");
	});

	it("should return BAD_REQUEST, when no components provided", () => {
		// arrange
		const components : SmeltingComponent[] = [];

		const fixtureTargetMb = faker.number.int();
		const fixtureAvailableMinerals = availableMineralsFixture();

		// act
		const result = sut.checkEntryConstraints(
				fixtureTargetMb,
				components,
				fixtureAvailableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.BAD_REQUEST);
		expect(result.statusContext).toBe("No components have been provided");
	});

	it("should return INSUFFICIENT_TOTAL_MB, when not enough total millibuckets from available minerals", () => {
		// arrange
		const targetMb = 1000;

		const fixtureComponents : SmeltingComponent[] = smeltingComponentArrayFixture(1);
		const fixtureAvailableMinerals = availableMineralsFixture(1, 1);

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				fixtureComponents,
				fixtureAvailableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
		expect(result.statusContext).toBe("Not enough total material available");
	});

	it("should return INSUFFICIENT_SPECIFIC_MINERAL_MB, when not enough of a required component", () => {
		// arrange
		const targetMb = 144;
		const components : SmeltingComponent[] = bronzeComponents();
		const availableMinerals = AvailableMineralBuilder
				.create()
				.add("copper", 10, 10)
				.add("tin", 10, 10)
				.build();

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				components,
				availableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB);
		expect(result.statusContext).toBe("Not enough copper for minimum requirement");
	});

	it("should return SUCCESS, when all conditions are satisfied", () => {
		// arrange
		const targetMb = 144;
		const components : SmeltingComponent[] = bronzeComponents();
		const availableMinerals = AvailableMineralBuilder
				.create()
				.add("copper", 20, 10)
				.add("tin", 20, 10)
				.build();

		// act
		const result = sut.checkEntryConstraints(
				targetMb,
				components,
				availableMinerals
		);

		// assert
		expect(result.status).toBe(OutputCode.SUCCESS);
	});
});
