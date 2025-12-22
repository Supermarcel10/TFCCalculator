import {ICombinatorialSearchService} from "@/services/calculation/abstract/ICombinationalSearchService";
import {PerComponentPlan} from "@/services/calculation/abstract/IComponentPlanService";


export class CombinatorialSearchService implements ICombinatorialSearchService {
	findComponentCombination(plans : PerComponentPlan[], targetMb : number) : Map<string, number> | null {
		const n = plans.length;
		plans.sort((a, b) => a.candidates.length - b.candidates.length);

		const suffixMin = new Int32Array(n + 1);
		const suffixMax = new Int32Array(n + 1);
		suffixMin[n] = 0;
		suffixMax[n] = 0;

		for (let i = n - 1; i >= 0; i--) {
			const minCand = this.getMin(plans[i].candidates);
			const maxCand = this.getMax(plans[i].candidates);
			suffixMin[i] = minCand + suffixMin[i + 1];
			suffixMax[i] = maxCand + suffixMax[i + 1];
		}

		const choice = new Map<string, number>();
		const seen = new Set<string>();
		let solved = false;

		const dfs = (i : number, sumSoFar : number) : void => {
			if (solved) {
				return;
			}

			if (sumSoFar > targetMb) {
				return;
			}

			if (sumSoFar + suffixMin[i] > targetMb) {
				return;
			}

			if (sumSoFar + suffixMax[i] < targetMb) {
				return;
			}

			if (i === n) {
				if (sumSoFar === targetMb) {
					solved = true;
				}

				return;
			}

			const plan = plans[i];
			const need = targetMb - sumSoFar - suffixMin[i + 1];
			const options = plan.candidates.slice().sort((a, b) => Math.abs(a - need) - Math.abs(b - need));

			for (const opt of options) {
				const newSum = sumSoFar + opt;

				if (newSum + suffixMin[i + 1] > targetMb) {
					continue;
				}

				if (newSum + suffixMax[i + 1] < targetMb) {
					continue;
				}

				const key = `${i}|${newSum}`;
				if (seen.has(key)) {
					continue;
				}

				seen.add(key);

				choice.set(plan.component, opt);
				dfs(i + 1, newSum);
				if (solved) {
					return;
				}

				choice.delete(plan.component);
			}
		};

		if (n === 1) {
			if (plans[0].candidates.includes(targetMb)) {
				const m = new Map<string, number>();
				m.set(plans[0].component, targetMb);
				return m;
			}

			return null;
		}

		dfs(0, 0);
		return solved ? choice : null;
	}

	private getMin(arr : number[]) : number {
		return arr.length ? arr[0] : 0;
	}

	private getMax(arr : number[]) : number {
		return arr.length ? arr.at(arr.length - 1) ?? 0 : 0;
	}
}
