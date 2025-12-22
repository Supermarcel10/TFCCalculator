import {QuantifiedMineral} from "@/types";
import {ComponentDP} from "@/services/calculation/abstract/IDPService";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";


export type PerComponentPlan = {
	component : string;
	minMb : number;
	maxMb : number;
	dp : ComponentDP;
	candidates : number[];
};

export interface IComponentPlanService {
	createComponentPlans(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>
	) : PerComponentPlan[] | null;
}
