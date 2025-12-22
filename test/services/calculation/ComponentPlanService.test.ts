import {ComponentPlanService} from "@/services/calculation/ComponentPlanService";
import {IDPService} from "@/services/calculation/abstract/IDPService";
import {createQuantifiedMineral} from "@test/helpers";


describe("ComponentPlanService", () => {
	let mockDPService : jest.Mocked<IDPService> = {
		buildComponentDP : jest.fn(),
		reconstructMinerals : jest.fn()
	};

	let sut = new ComponentPlanService(mockDPService);

	describe("createComponentPlans", () => {
		it("should create plans for multiple components", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 20, maxPct : 40}, // 200-400 mB
				{component : "copper", minPct : 30, maxPct : 50} // 300-500 mB
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 10)]], // 1000 mB
						["copper", [createQuantifiedMineral("Copper Ore", "copper", 100, 10)]] // 1000 mB
					]
			);

			mockDPService.buildComponentDP.mockImplementation((component, _, cap) => {
				const reachable = new Uint8Array(cap + 1);
				reachable[0] = 1;

				// Make all values up to cap reachable
				for (let i = 100; i <= cap; i += 100) {
					reachable[i] = 1;
				}

				return {
					component,
					cap,
					reachable,
					prevSum : new Int32Array(cap + 1),
					lastChunkIndex : new Int32Array(cap + 1),
					chunks : []
				};
			});

			const plans = sut.createComponentPlans(1000, normalizedComponents, normalizedInv);

			expect(plans).not.toBe(null);
			expect(plans).toHaveLength(2);

			// Iron plan
			expect(plans?.[0].component).toBe("iron");
			expect(plans?.[0].minMb).toBe(200); // 20% of 1000
			expect(plans?.[0].maxMb).toBe(400); // 40% of 1000
			expect(plans?.[0].candidates).toContain(200);
			expect(plans?.[0].candidates).toContain(300);
			expect(plans?.[0].candidates).toContain(400);

			// Copper plan
			expect(plans?.[1].component).toBe("copper");
			expect(plans?.[1].minMb).toBe(300); // 30% of 1000
			expect(plans?.[1].maxMb).toBe(500); // 50% of 1000
		});

		it("should return null when no candidates for a component", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 60, maxPct : 80} // 600-800 mB
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 5)]] // 500 mB
					]
			);

			mockDPService.buildComponentDP.mockReturnValue(
					{
						component : "iron",
						cap : 500,
						reachable : new Uint8Array(501),
						prevSum : new Int32Array(501),
						lastChunkIndex : new Int32Array(501),
						chunks : []
					}
			);

			const plans = sut.createComponentPlans(1000, normalizedComponents, normalizedInv);

			expect(plans).toBeNull();
		});

		it("should deduplicate and sort candidates", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 20, maxPct : 40} // 200-400 mB
			];

			const normalizedInv = new Map(
					[
						["iron", [createQuantifiedMineral("Iron Ore", "iron", 100, 10)]] // 1000 mB
					]
			);

			mockDPService.buildComponentDP.mockReturnValue(
					{
						component : "iron",
						cap : 400,
						reachable : (() => {
							const arr = new Uint8Array(401);
							arr[0] = 1;
							arr[200] = 1;
							arr[300] = 1;
							arr[400] = 1;
							return arr;
						})(),
						prevSum : new Int32Array(401),
						lastChunkIndex : new Int32Array(401),
						chunks : []
					}
			);

			const plans = sut.createComponentPlans(1000, normalizedComponents, normalizedInv);

			expect(plans?.[0].candidates).toEqual([200, 300, 400]);
		});

		it("should handle empty inventory for component", () => {
			const normalizedComponents = [
				{component : "iron", minPct : 20, maxPct : 40} // 200-400 mB
			];

			const normalizedInv = new Map(
					[
						["iron", []] // 0 mB
					]
			);

			const plans = sut.createComponentPlans(1000, normalizedComponents, normalizedInv);

			expect(plans).toBeNull();
		});
	});
});
