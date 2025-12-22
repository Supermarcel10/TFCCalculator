import {InputNormalizationService} from "@/services/calculation/InputNormalizationService";
import {SmeltingComponent} from "@/types";
import {createQuantifiedMineral} from "@test/helpers";


describe("InputNormalizationService", () => {
	let sut = new InputNormalizationService();

	describe("normalizeComponents", () => {
		it("should normalize component names", () => {
			const components : SmeltingComponent[] = [
				{mineral : " IRON ", min : 20, max : 40},
				{mineral : "Copper", min : 30, max : 50}
			];

			const result = sut.normalizeComponents(components);

			expect(result).toEqual(
					[
						{component : "iron", minPct : 20, maxPct : 40},
						{component : "copper", minPct : 30, maxPct : 50}
					]
			);
		});

		it("should handle empty array", () => {
			const result = sut.normalizeComponents([]);
			expect(result).toEqual([]);
		});
	});

	describe("normalizeInventory", () => {
		it("should normalize keys and combine entries", () => {
			const inventory = new Map(
					[
						[" IRON ", [createQuantifiedMineral("Iron Ore", "iron", 100, 5)]],
						["iron", [createQuantifiedMineral("Iron Dust", "iron", 100, 3)]],
						["COPPER", [createQuantifiedMineral("Copper Ore", "copper", 100, 4)]]
					]
			);

			const result = sut.normalizeInventory(inventory);

			expect(result.size).toBe(2);
			expect(result.get("iron")).toHaveLength(2);
			expect(result.get("copper")).toHaveLength(1);
		});

		it("should handle empty map", () => {
			const inventory = new Map();
			const result = sut.normalizeInventory(inventory);
			expect(result.size).toBe(0);
		});
	});

	describe("normalizeKey", () => {
		it("should trim and lowercase keys", () => {
			expect(sut.normalizeKey("  IRON  ")).toBe("iron");
			expect(sut.normalizeKey("Copper")).toBe("copper");
			expect(sut.normalizeKey("TiN ")).toBe("tin");
		});

		it("should handle empty string", () => {
			expect(sut.normalizeKey("")).toBe("");
		});
	});
});
