import {CombinatorialSearchService} from "@/services/calculation/CombinatorialSearchService";
import {PerComponentPlan} from "@/services/calculation/abstract/IComponentPlanService";
import {ComponentDP} from "@/services/calculation/abstract/IDPService";


describe("CombinatorialSearchService", () => {
	let sut = new CombinatorialSearchService();
	// TODO: Check if this method can just be replaced?
	describe("hasTarget", () => {
		it("should find target in sorted array", () => {
			const arr = [100, 200, 300, 400, 500];

			expect(sut.hasTarget(arr, 100)).toBe(true);
			expect(sut.hasTarget(arr, 300)).toBe(true);
			expect(sut.hasTarget(arr, 500)).toBe(true);
		});

		it("should not find target not in array", () => {
			const arr = [100];

			expect(sut.hasTarget(arr, 0)).toBe(false);
		});

		it("should handle empty array", () => {
			const arr : number[] = [];

			expect(sut.hasTarget(arr, 100)).toBe(false);
		});
	});

	describe("findComponentCombination", () => {
		it("should find combination for single component", () => {
			const plans : PerComponentPlan[] = [
				{
					component : "iron",
					minMb : 200,
					maxMb : 400,
					dp : {} as ComponentDP,
					candidates : [200, 250, 300, 350, 400]
				}
			];

			const result = sut.findComponentCombination(plans, 300);

			expect(result?.get("iron")).toBe(300);
		});

		it("should return null for single component without target", () => {
			const plans : PerComponentPlan[] = [
				{
					component : "iron",
					minMb : 200,
					maxMb : 400,
					dp : {} as ComponentDP,
					candidates : [200, 250, 300, 350, 400]
				}
			];

			const result = sut.findComponentCombination(plans, 275);

			expect(result).toBeNull();
		});

		it("should find combination for multiple components", () => {
			const plans : PerComponentPlan[] = [
				{
					component : "iron",
					minMb : 200,
					maxMb : 400,
					dp : {} as ComponentDP,
					candidates : [200, 300]
				},
				{
					component : "copper",
					minMb : 300,
					maxMb : 500,
					dp : {} as ComponentDP,
					candidates : [400, 500]
				}
			];

			// 300 + 400
			const result = sut.findComponentCombination(plans, 700);

			expect(result?.get("iron")).toBe(300);
			expect(result?.get("copper")).toBe(400);
		});

		it("should prune branches that cannot reach target", () => {
			const plans : PerComponentPlan[] = [
				{
					component : "iron",
					minMb : 200,
					maxMb : 400,
					dp : {} as ComponentDP,
					candidates : [200, 400]
				},
				{
					component : "copper",
					minMb : 300,
					maxMb : 500,
					dp : {} as ComponentDP,
					candidates : [300, 500]
				}
			];

			// No combination sums to 600
			const result = sut.findComponentCombination(plans, 600);

			expect(result).toBeNull();
		});

		it("should handle multiple components with many candidates", () => {
			const plans : PerComponentPlan[] = [
				{
					component : "iron",
					minMb : 100,
					maxMb : 200,
					dp : {} as ComponentDP,
					candidates : [100, 125, 150, 175, 200]
				},
				{
					component : "copper",
					minMb : 100,
					maxMb : 200,
					dp : {} as ComponentDP,
					candidates : [100, 125, 150, 175, 200]
				},
				{
					component : "tin",
					minMb : 100,
					maxMb : 200,
					dp : {} as ComponentDP,
					candidates : [100, 125, 150, 175, 200]
				}
			];

			const result = sut.findComponentCombination(plans, 450);

			expect(result?.size).toBe(3);

			const iron = result?.get("iron")!;
			const copper = result?.get("copper")!;
			const tin = result?.get("tin")!;

			expect(iron + copper + tin).toBe(450);
		});
	});
});
