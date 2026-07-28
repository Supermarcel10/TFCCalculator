import {ValidationService} from "@/services/calculation/ValidationService";
import {createQuantifiedMineral} from "@test/helpers";
import {OutputCode} from "@/services/calculation/abstract/IOutputCalculator";


describe("ValidationService", () => {
	let sut = new ValidationService();

	describe("validateInput", () => {
		it("should return valid for correct input", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 20, maxPct : 40}
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 10)]]
					]
			);

			const result = sut.validateInput(1000, normalizedComponents, normalizedInv);

			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should reject non-integer targetMb", () => {
			const normalizedComponents = [{component : "iron", minPct : 20, maxPct : 40}];
			const normalizedInv = new Map([["iron", []]]);

			const testCases = [
				{target : 0, desc : "zero"},
				{target : -100, desc : "negative"},
				{target : 100.5, desc : "decimal"},
				{target : Number.POSITIVE_INFINITY, desc : "pos infinity"},
				{target : Number.NEGATIVE_INFINITY, desc : "neg infinity"},
				{target : Number.NaN, desc : "NaN"}
			];

			testCases.forEach(({target}) => {
				const result = sut.validateInput(target, normalizedComponents, normalizedInv);
				expect(result.isValid).toBe(false);
				expect(result.error?.status).toBe(OutputCode.BAD_REQUEST);
				expect(result.error?.statusContext).toContain("positive integer");
			});
		});

		it("should reject empty components", () => {
			const normalizedInv = new Map([["iron", []]]);
			const result = sut.validateInput(1000, [], normalizedInv);

			expect(result.isValid).toBe(false);
			expect(result.error?.status).toBe(OutputCode.BAD_REQUEST);
			expect(result.error?.statusContext).toContain("components are required");
		});

		it("should reject insufficient total material", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 20, maxPct : 40}
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 5)]] // 500mB total
					]
			);

			const result = sut.validateInput(1000, normalizedComponents, normalizedInv);

			expect(result.isValid).toBe(false);
			expect(result.error?.status).toBe(OutputCode.INSUFFICIENT_TOTAL_MB);
		});

		it("should reject insufficient specific mineral", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 60, maxPct : 80},
				{component : "copper", minPct : 20, maxPct : 40}
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 10)]], // 900mB total
						["copper", [createQuantifiedMineral("Copper Ore", "copper", 100, 1)]] // 100mB total
					]
			);

			const result = sut.validateInput(1000, normalizedComponents, normalizedInv);

			expect(result.isValid).toBe(false);
			expect(result.error?.status).toBe(OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB);
			expect(result.error?.statusContext).toContain("Not enough copper for minimum requirement");
		});

		it("should handle multiple components validation", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 30, maxPct : 50},
				{component : "copper", minPct : 20, maxPct : 40}
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 8)]], // 800mB
						["copper", [createQuantifiedMineral("Copper Ore", "copper", 100, 6)]] // 600mB
					]
			);

			const result = sut.validateInput(1000, normalizedComponents, normalizedInv);

			expect(result.isValid).toBe(true);
		});
	});
});
