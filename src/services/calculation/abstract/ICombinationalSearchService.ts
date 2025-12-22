import {PerComponentPlan} from "@/services/calculation/abstract/IComponentPlanService";


export interface ICombinatorialSearchService {
	findComponentCombination(plans : PerComponentPlan[], targetMb : number) : Map<string, number> | null;
}
