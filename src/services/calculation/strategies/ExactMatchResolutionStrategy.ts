import {IOutputResolutionStrategy} from "@/services/calculation/abstract/IOutputResolutionStrategy";
import {CalculationOutput, FlagValues, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";
import {QuantifiedMineral} from "@/types";
import {IValidationService} from "@/services/calculation/abstract/IValidationService";


export class ExactMatchResolutionStrategy implements IOutputResolutionStrategy {
	resolve(
		targetMb: number,
		normalizedComponents: NormalizedComponent[],
		normalizedInventory: Map<string, QuantifiedMineral[]>,
		_: FlagValues | undefined,
		calculationFn: (amount: number) => CalculationOutput | null,
		validationService: IValidationService
	): CalculationOutput {
		const validation = validationService.validateInput(targetMb, normalizedComponents, normalizedInventory);
		if (!validation.isValid && validation.error) {
			return validation.error;
		}

		const result = calculationFn(targetMb);

		if (result) {
			return result;
		}

		return {
			status: OutputCode.UNFEASIBLE,
			statusContext: "Could not find valid combination of materials",
			amountMb: 0,
			usedMinerals: []
		};
	}
}
