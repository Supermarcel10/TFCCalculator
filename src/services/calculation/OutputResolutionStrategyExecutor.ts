import { IOutputResolutionStrategyExecutor } from "./abstract/IOutputResolutionStrategyExecutor";
import { CalculationOutput, Flags, FlagValues, OutputCode } from "./abstract/IOutputCalculator";
import { NormalizedComponent } from "./abstract/IInputNormalizationService";
import { QuantifiedMineral } from "@/types";
import { IComponentPlanService, PerComponentPlan } from "./abstract/IComponentPlanService";
import { ICombinatorialSearchService } from "./abstract/ICombinationalSearchService";
import { ComponentPlanService } from "./ComponentPlanService";
import { CombinatorialSearchService } from "./CombinatorialSearchService";
import { IDPService } from "./abstract/IDPService";
import { DPService } from "./DPService";
import { ChunkingService } from "./ChunkingService";
import { IOutputResolutionStrategySelector } from "./abstract/IOutputResolutionStrategySelector";
import { OutputResolutionStrategySelector } from "./OutputResolutionStrategySelector";


export default class OutputResolutionStrategyExecutor implements IOutputResolutionStrategyExecutor {
  private readonly outputResolutionStrategySelector : IOutputResolutionStrategySelector;
  private readonly dpService : IDPService;
  private readonly componentPlanService : IComponentPlanService;
	private readonly combinatorialSearchService : ICombinatorialSearchService;

	constructor() {
	  const chunkingService = new ChunkingService();

    this.outputResolutionStrategySelector = new OutputResolutionStrategySelector();
	  this.dpService = new DPService(chunkingService);
  	this.componentPlanService = new ComponentPlanService(this.dpService);
  	this.combinatorialSearchService = new CombinatorialSearchService();
	}

	public executeStrategy(
	  targetMb : number,
	  normalizedComponents : NormalizedComponent[],
	  normalizedInventory : Map<string, QuantifiedMineral[]>,
	  flags? : Flags,
		flagValues? : FlagValues,
	) {
  	const strategy = this.outputResolutionStrategySelector.selectStrategy(flags, flagValues);

  	const calculationFn = (amount: number) => this.attemptCalculation(
  		amount,
  		normalizedComponents,
  		normalizedInventory
  	);

  	return strategy.resolve(
  		targetMb,
  		flagValues,
  		calculationFn
  	);
	}

  private attemptCalculation(
		targetMb: number,
		normalizedComponents: NormalizedComponent[],
		normalizedInv: Map<string, QuantifiedMineral[]>
	): CalculationOutput | null {
		// 1. Create component plans
		const plans = this.componentPlanService.createComponentPlans(
				targetMb,
				normalizedComponents,
				normalizedInv
		);

		if (!plans) {
			return null;
		}

		// 2. Global window sanity check
		const sumMin = plans.reduce((s, p) => s + p.minMb, 0);
		const sumMax = plans.reduce((s, p) => s + p.maxMb, 0);
		if (sumMin > targetMb || sumMax < targetMb) {
			return null;
		}

		// 3. Find component combination
		const chosen = this.combinatorialSearchService.findComponentCombination(plans, targetMb);
		if (!chosen) {
			return null;
		}

		// 4. Reconstruct minerals
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
}
