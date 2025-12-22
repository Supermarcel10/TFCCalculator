import {ChunkingService} from "@/services/calculation/ChunkingService";
import {DPService} from "@/services/calculation/DPService";
import {createQuantifiedMineral} from "@test/helpers";
import {createDPWithPath, createSimpleDP, createTestChunks} from "@test/dp-test-utils";


describe("DPService", () => {
	let mockChunkingService : jest.Mocked<ChunkingService> = {
		splitIntoChunks : jest.fn(),
		splitAllIntoChunks : jest.fn()
	};

	let sut = new DPService(mockChunkingService);

	describe("buildComponentDP", () => {
		it("should build DP table for simple case", () => {
			const minerals = [createQuantifiedMineral("Iron Ore", "iron", 100, 3)];
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 2}
			);

			mockChunkingService.splitAllIntoChunks.mockReturnValue(chunks);

			const dp = sut.buildComponentDP("iron", minerals, 300);

			expect(dp.component).toBe("iron");
			expect(dp.cap).toBe(300);
			expect(dp.reachable[0]).toBe(1);
			expect(dp.reachable[100]).toBe(1);
			expect(dp.reachable[200]).toBe(1);
			expect(dp.reachable[300]).toBe(1);
			expect(dp.chunks).toBe(chunks);
		});

		it("should handle zero-yield minerals", () => {
			const minerals = [createQuantifiedMineral("Iron Ore", "iron", 0, 10)];
			mockChunkingService.splitAllIntoChunks.mockReturnValue([]);

			const dp = sut.buildComponentDP("iron", minerals, 100);

			expect(dp.reachable[0]).toBe(1);
			for (let i = 1; i <= 100; i++) {
				expect(dp.reachable[i]).toBe(0);
			}
		});

		it("should skip chunks with weight exceeding cap", () => {
			const minerals = [createQuantifiedMineral("Iron Ore", "iron", 100, 5)];
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 2},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 4}
			);

			mockChunkingService.splitAllIntoChunks.mockReturnValue(chunks);

			const dp = sut.buildComponentDP("iron", minerals, 300);

			expect(dp.reachable[400]).toBe(undefined);
		});
	});

	describe("reconstructMinerals", () => {
		it("should reconstruct minerals from DP result", () => {
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 2}
			);

			const dp = createDPWithPath("iron", 300, chunks, [
				{sum : 100, prevSum : 0, chunkIndex : 0},
				{sum : 300, prevSum : 100, chunkIndex : 1}
			]);

			const result = sut.reconstructMinerals(dp, 300);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Iron Ore");
			expect(result[0].quantity).toBe(3);
			expect(result[0].yield).toBe(100);
		});

		it("should handle multiple minerals reconstruction", () => {
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Dust", produces : "iron", yieldValue : 100, quantity : 10, units : 1}
			);

			const dp = createDPWithPath("iron", 200, chunks, [
				{sum : 100, prevSum : 0, chunkIndex : 0},
				{sum : 200, prevSum : 100, chunkIndex : 1}
			]);

			const result = sut.reconstructMinerals(dp, 200);

			expect(result).toHaveLength(2);

			const ironOre = result.find(m => m.name === "Iron Ore");
			const ironDust = result.find(m => m.name === "Iron Dust");

			expect(ironOre?.quantity).toBe(1);
			expect(ironOre?.yield).toBe(100);
			expect(ironDust?.quantity).toBe(1);
			expect(ironDust?.yield).toBe(100);
		});

		it("should return empty array for zero sum", () => {
			const dp = createSimpleDP("iron", 100, [], [0]);

			const result = sut.reconstructMinerals(dp, 0);

			expect(result).toEqual([]);
		});

		it("should handle complex reconstruction path", () => {
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Dust", produces : "iron", yieldValue : 50, quantity : 10, units : 1},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1}
			);

			const dp = createDPWithPath("iron", 250, chunks, [
				{sum : 100, prevSum : 0, chunkIndex : 0},
				{sum : 150, prevSum : 100, chunkIndex : 1},
				{sum : 250, prevSum : 150, chunkIndex : 2}
			]);

			const result = sut.reconstructMinerals(dp, 250);

			expect(result).toHaveLength(2);

			const ironOre = result.find(m => m.name === "Iron Ore");
			const ironDust = result.find(m => m.name === "Iron Dust");

			expect(ironOre?.quantity).toBe(2);
			expect(ironDust?.quantity).toBe(1);
		});

		it("should handle broken reconstruction path gracefully", () => {
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1}
			);

			const dp = createSimpleDP("iron", 200, chunks, [0, 200]);

			// Broken path due to invalid predecessor for 200
			dp.prevSum[200] = -1;
			dp.lastChunkIndex[200] = -1;

			const result = sut.reconstructMinerals(dp, 200);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0); // Empty as non-reconstructible
		});

		it("should handle duplicate minerals in chunks", () => {
			const chunks = createTestChunks(
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 2},
					{name : "Iron Ore", produces : "iron", yieldValue : 100, quantity : 10, units : 1}
			);

			const dp = createDPWithPath("iron", 400, chunks, [
				{sum : 100, prevSum : 0, chunkIndex : 0},
				{sum : 300, prevSum : 100, chunkIndex : 1},
				{sum : 400, prevSum : 300, chunkIndex : 2}
			]);

			const result = sut.reconstructMinerals(dp, 400);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Iron Ore");
			expect(result[0].quantity).toBe(4); // 1 + 2 + 1
		});
	});
});
