import {QuantifiedMineral} from "@/types";
import {IComponentPlanService, PerComponentPlan} from "@/services/calculation/abstract/IComponentPlanService";
import {IDPService} from "@/services/calculation/abstract/IDPService";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";


export class ComponentPlanService implements IComponentPlanService {
	constructor(private dpService : IDPService) {}

	createComponentPlans(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>
	) : PerComponentPlan[] | null {
		const plans : PerComponentPlan[] = [];

		for (const {component, minPct, maxPct} of normalizedComponents) {
			const inv : QuantifiedMineral[] = normalizedInv.get(component) ?? [];

			const availableMb = inv.reduce((s, u) => s + u.yield * u.quantity, 0);
			const minMb = Math.ceil((minPct / 100) * targetMb);
			const maxMb = Math.floor((maxPct / 100) * targetMb);

			const cap = Math.max(0, Math.min(availableMb, maxMb));
			const dp = this.dpService.buildComponentDP(component, inv, cap);

			const candidates : number[] = [];
			if (minMb <= cap) {
				const lo = Math.max(0, minMb);
				const hi = Math.min(cap, maxMb);
				for (let mb = lo; mb <= hi; mb++) {
					if (dp.reachable[mb]) {
						candidates.push(mb);
					}
				}
			}

			if (candidates.length === 0) {
				return null;
			}

			candidates.sort((a, b) => a - b);
			const dedup = [...new Set(candidates)];

			plans.push(
					{
						component,
						minMb,
						maxMb,
						dp,
						candidates : dedup
					});
		}
		return plans;
	}
}
