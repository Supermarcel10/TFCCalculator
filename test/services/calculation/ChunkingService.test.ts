import {ChunkingService} from "@/services/calculation/ChunkingService";
import {createQuantifiedMineral} from "@test/helpers";


describe("ChunkingService", () => {
	let sut = new ChunkingService();

	describe("splitIntoChunks", () => {
		it("should split mineral into binary chunks", () => {
			const mineral = createQuantifiedMineral("Iron Ore", "iron", 100, 7);

			const chunks = sut.splitIntoChunks(mineral);

			expect(chunks).toHaveLength(3);
			expect(chunks[0]).toEqual(
					{
						weight : 100, // 1 unit * 100 yield
						qm : mineral,
						qty : 1
					}
			);
			expect(chunks[1]).toEqual(
					{
						weight : 200, // 2 units * 100 yield
						qm : mineral,
						qty : 2
					}
			);
			expect(chunks[2]).toEqual(
					{
						weight : 400, // 4 units * 100 yield
						qm : mineral,
						qty : 4
					}
			);
		});

		it("should respect clampUnitsTo parameter", () => {
			const mineral = createQuantifiedMineral("Iron Ore", "iron", 100, 10);

			const chunks = sut.splitIntoChunks(mineral, 6);

			expect(chunks).toHaveLength(3);
			const totalUnits = chunks.reduce((sum, chunk) => sum + chunk.qty, 0);
			expect(totalUnits).toBe(6);
		});

		it("should handle zero quantity", () => {
			const mineral = createQuantifiedMineral("Iron Ore", "iron", 100, 0);
			const chunks = sut.splitIntoChunks(mineral);

			expect(chunks).toHaveLength(0);
		});

		it("should handle negative clamp", () => {
			const mineral = createQuantifiedMineral("Iron Ore", "iron", 100, 5);
			const chunks = sut.splitIntoChunks(mineral, -3);

			expect(chunks).toHaveLength(0);
		});
	});

	describe("splitAllIntoChunks", () => {
		it("should split multiple minerals with cap calculation", () => {
			const minerals = [
				createQuantifiedMineral("Iron Ore", "iron", 100, 10),
				createQuantifiedMineral("Iron Dust", "iron", 100, 5)
			];

			const cap = 800; // max 8 units * 100 yield
			const chunks = sut.splitAllIntoChunks(minerals, cap);

			// Iron Ore: maxUnits = floor(800/100) = 8
			// Iron Dust: maxUnits = floor(800/100) = 8, but only 5 available
			const totalWeight = chunks.reduce((sum, chunk) => sum + chunk.weight, 0);
			expect(totalWeight).toBeLessThanOrEqual(cap * 2);
		});

		it("should handle minerals with different yields", () => {
			const minerals = [
				createQuantifiedMineral("Rich Iron", "iron", 200, 5),
				createQuantifiedMineral("Poor Iron", "iron", 50, 10)
			];

			const cap = 500;
			const chunks = sut.splitAllIntoChunks(minerals, cap);

			// Rich Iron: maxUnits = floor(500/200) = 2
			// Poor Iron: maxUnits = floor(500/50) = 10
			const richIronChunks = chunks.filter(c => c.qm.name === "Rich Iron");
			const totalRichIronUnits = richIronChunks.reduce((sum, c) => sum + c.qty, 0);
			expect(totalRichIronUnits).toBe(2);
		});
	});
});
