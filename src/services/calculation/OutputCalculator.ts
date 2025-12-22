import {IDPService} from "@/services/calculation/abstract/IDPService";
import {IInputNormalizationService} from "./abstract/IInputNormalizationService";
import {CalculationOutput, Flags, FlagValues, IOutputCalculator, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {IComponentPlanService, PerComponentPlan} from "./abstract/IComponentPlanService";
import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {IValidationService} from "@/services/calculation/abstract/IValidationService";
import {ICombinatorialSearchService} from "./abstract/ICombinationalSearchService";
import {ChunkingService} from "@/services/calculation/ChunkingService";
import {DPService} from "@/services/calculation/DPService";
import {InputNormalizationService} from "@/services/calculation/InputNormalizationService";
import {ValidationService} from "@/services/calculation/ValidationService";
import {ComponentPlanService} from "@/services/calculation/ComponentPlanService";
import {CombinatorialSearchService} from "@/services/calculation/CombinatorialSearchService";


export class OutputCalculator implements IOutputCalculator {
	private readonly inputNormalizationService : IInputNormalizationService;
	private readonly validationService : IValidationService;
	private readonly componentPlanService : IComponentPlanService;
	private readonly combinatorialSearchService : ICombinatorialSearchService;
	private readonly dpService : IDPService;

	constructor() {
		const chunkingService = new ChunkingService();
		this.dpService = new DPService(chunkingService);

		this.inputNormalizationService = new InputNormalizationService();
		this.validationService = new ValidationService();
		this.componentPlanService = new ComponentPlanService(this.dpService);
		this.combinatorialSearchService = new CombinatorialSearchService();
	}

	calculateSmeltingOutput(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>,
			flags? : Flags,
			flagValues? : FlagValues
	) : CalculationOutput {
		// 1. Normalize inputs
		const normalizedComponents = this.inputNormalizationService.normalizeComponents(components);
		const normalizedInv = this.inputNormalizationService.normalizeInventory(availableMinerals);

		// 2. Validate inputs
		const validationResult = this.validationService.validateInput(
				targetMb,
				normalizedComponents,
				normalizedInv
		);

		if (!validationResult.isValid && validationResult.error) {
			return validationResult.error;
		}

		// 3. Create component plans
		const plans = this.componentPlanService.createComponentPlans(
				targetMb,
				normalizedComponents,
				normalizedInv
		);

		if (!plans) {
			return this.createUnfeasibleResult();
		}

		// 4. Global window sanity check
		const sumMin = plans.reduce((s, p) => s + p.minMb, 0);
		const sumMax = plans.reduce((s, p) => s + p.maxMb, 0);
		if (sumMin > targetMb || sumMax < targetMb) {
			return this.createUnfeasibleResult();
		}

		// 5. Find component combination
		const chosen = this.combinatorialSearchService.findComponentCombination(plans, targetMb);
		if (!chosen) {
			return this.createUnfeasibleResult();
		}

		// 6. Reconstruct minerals
		const usedMinerals = this.reconstructAllMinerals(plans, chosen);

		return {
			status : OutputCode.SUCCESS,
			amountMb : targetMb,
			usedMinerals
		};
	}

	private reconstructAllMinerals(
			plans : PerComponentPlan[],
			chosen : Map<string, number>
	) : QuantifiedMineral[] {
		const byName = new Map<string, QuantifiedMineral>();
		for (const plan of plans) {
			const sumChosen = chosen.get(plan.component)!;
			for (const qm of this.dpService.reconstructMinerals(plan.dp, sumChosen)) {
				const existing = byName.get(qm.name);
				if (existing) {
					existing.quantity += qm.quantity;
				} else {
					byName.set(qm.name, {...qm});
				}
			}
		}
		return Array.from(byName.values());
	}

	private createUnfeasibleResult() : CalculationOutput {
		return {
			status : OutputCode.UNFEASIBLE,
			statusContext : "Could not find valid combination of materials",
			amountMb : 0,
			usedMinerals : []
		};
	}
}
