import {OutputCalculator} from "@/services/calculation/OutputCalculator";
import {createComponent, createQuantifiedMineral, expectUsedToNotExceedAvailable} from "@test/helpers";
import {OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {QuantifiedMineral} from "@/types";


describe("OutputCalculator", () => {
	let sut = new OutputCalculator();

	describe("calculateSmeltingOutput", () => {
		it("should calculate successful smelting output", () => {
			const components = [
				createComponent("iron", 20, 40),
				createComponent("copper", 60, 80)
			];

			const availableMinerals : Map<string, QuantifiedMineral[]> = new Map(
					[
						[
							"iron",
							[
								createQuantifiedMineral("Large Iron Ore", "iron", 100, 2)
							]
						],
						[
							"copper",
							[createQuantifiedMineral("Large Copper Ore", "copper", 100, 8)]
						]
					]
			);

			const result = sut.calculateSmeltingOutput(
					1000,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.SUCCESS);
			expect(result.amountMb).toBe(1000);
			expect(result.usedMinerals.length).toBeGreaterThan(0);
			expectUsedToNotExceedAvailable(availableMinerals, result.usedMinerals);
		});

		it("should handle invalid input gracefully", () => {
			const components = [createComponent("iron", 20, 40)];

			const availableMinerals : Map<string, QuantifiedMineral[]> = new Map(
					[
						[
							"iron",
							[
								createQuantifiedMineral("Large Iron Ore", "iron", 100, 2)
							]
						],
						[
							"copper",
							[createQuantifiedMineral("Large Copper Ore", "copper", 100, 8)]
						]
					]
			);

			const result = sut.calculateSmeltingOutput(
					0, // Invalid target
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.BAD_REQUEST);
			expect(result.statusContext).toContain("positive integer");
		});

		it("should return unfeasible when no combination exists", () => {
			const components = [
				createComponent("iron", 80, 90), // 800-900 mB
				createComponent("copper", 10, 20) // 100-200 mB
			];

			const availableMinerals = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 5)]], // 500 mB
						["copper", [createQuantifiedMineral("Copper Ore", "copper", 100, 5)]] // 500 mB
					]
			);

			const result = sut.calculateSmeltingOutput(
					1000,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB);
			expect(result.statusContext).toContain("Not enough iron for minimum requirement");
		});

		it("should handle multiple minerals per component", () => {
			const components = [createComponent("iron", 100, 100)]; // Must be exactly 100% iron

			const availableMinerals = new Map(
					[
						[
							"iron", [
							createQuantifiedMineral("Iron Ore", "iron", 100, 3), // 300 mB
							createQuantifiedMineral("Iron Dust", "iron", 50, 4), // 200 mB
							createQuantifiedMineral("Rich Iron", "iron", 200, 2) // 400 mB
						]
						]
					]
			);

			const result = sut.calculateSmeltingOutput(
					500,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.SUCCESS);
			expect(result.amountMb).toBe(500);
			expectUsedToNotExceedAvailable(availableMinerals, result.usedMinerals);
		});

		it("should handle complex multi-component scenario", () => {
			const components = [
				createComponent("iron", 25, 35), // 250-350 mB
				createComponent("copper", 25, 35), // 250-350 mB
				createComponent("tin", 25, 35), // 250-350 mB
				createComponent("gold", 25, 35) // 250-350 mB
			];

			const availableMinerals = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 10)]], // 1000 mB
						["copper", [createQuantifiedMineral("Copper Ore", "copper", 100, 10)]], // 1000 mB
						["tin", [createQuantifiedMineral("Tin Ore", "tin", 100, 10)]], // 1000 mB
						["gold", [createQuantifiedMineral("Gold Ore", "gold", 100, 10)]] // 1000 mB
					]
			);

			const result = sut.calculateSmeltingOutput(
					2000,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.SUCCESS);
			expect(result.amountMb).toBe(2000);
			expectUsedToNotExceedAvailable(availableMinerals, result.usedMinerals);
		});
	});

	describe("edge cases", () => {
		it("should handle zero-yield minerals", () => {
			const components = [createComponent("iron", 0, 100)];

			const availableMinerals = new Map(
					[
						["iron", [createQuantifiedMineral("Iron", "iron", 0, 100)]] // 0 mB
					]
			);

			const result = sut.calculateSmeltingOutput(
					100,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
			expect(result.statusContext).toBe("Not enough total material available");
		});

		it("should handle very large quantities efficiently", () => {
			const components = [createComponent("iron", 100, 100)];

			const availableMinerals = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 1000)]] // 100_000 mB
					]
			);

			const result = sut.calculateSmeltingOutput(
					50000,
					components,
					availableMinerals
			);

			expect(result.status).toBe(OutputCode.SUCCESS);
			expect(result.amountMb).toBe(50000);
			expectUsedToNotExceedAvailable(availableMinerals, result.usedMinerals);
		});
	});
});
