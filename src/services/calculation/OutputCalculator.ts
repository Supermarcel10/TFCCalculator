import {IInputNormalizationService} from "./abstract/IInputNormalizationService";
import {CalculationOutput, Flags, FlagValues, IOutputCalculator} from "@/services/calculation/abstract/IOutputCalculator";
import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {IValidationService} from "@/services/calculation/abstract/IValidationService";
import {InputNormalizationService} from "@/services/calculation/InputNormalizationService";
import {ValidationService} from "@/services/calculation/ValidationService";
import { IOutputResolutionStrategyExecutor } from "./abstract/IOutputResolutionStrategyExecutor";
import OutputResolutionStrategyExecutor from "./OutputResolutionStrategyExecutor";


export class OutputCalculator implements IOutputCalculator {
	private readonly inputNormalizationService : IInputNormalizationService;
  private readonly outputResolutionStrategyExecutor : IOutputResolutionStrategyExecutor;
	private readonly validationService : IValidationService;

	constructor() {
		this.inputNormalizationService = new InputNormalizationService();
    this.outputResolutionStrategyExecutor = new OutputResolutionStrategyExecutor();
		this.validationService = new ValidationService();
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

		// 3. Execute Strategy
		return this.outputResolutionStrategyExecutor.executeStrategy(
      targetMb,
      normalizedComponents,
      normalizedInv,
      flags,
      flagValues
		);
	}
}
