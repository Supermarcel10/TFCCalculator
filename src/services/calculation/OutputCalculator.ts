import {IInputNormalizationService} from "./abstract/IInputNormalizationService";
import {CalculationOutput, Flags, FlagValues, IOutputCalculator} from "@/services/calculation/abstract/IOutputCalculator";
import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {InputNormalizationService} from "@/services/calculation/InputNormalizationService";
import { IOutputResolutionStrategyExecutor } from "./abstract/IOutputResolutionStrategyExecutor";
import OutputResolutionStrategyExecutor from "./OutputResolutionStrategyExecutor";


export class OutputCalculator implements IOutputCalculator {
	private readonly inputNormalizationService : IInputNormalizationService;
  private readonly outputResolutionStrategyExecutor : IOutputResolutionStrategyExecutor;

	constructor() {
		this.inputNormalizationService = new InputNormalizationService();
    this.outputResolutionStrategyExecutor = new OutputResolutionStrategyExecutor();
	}

	calculateSmeltingOutput(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>,
			flags? : Flags,
			flagValues? : FlagValues
	) : CalculationOutput {
		const normalizedComponents = this.inputNormalizationService.normalizeComponents(components);
		const normalizedInv = this.inputNormalizationService.normalizeInventory(availableMinerals);

		return this.outputResolutionStrategyExecutor.executeStrategy(
      targetMb,
      normalizedComponents,
      normalizedInv,
      flags,
      flagValues
		);
	}
}
