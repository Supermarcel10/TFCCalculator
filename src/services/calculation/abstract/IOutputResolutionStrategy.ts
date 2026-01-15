import {CalculationOutput, FlagValues} from "@/services/calculation/abstract/IOutputCalculator";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";
import {QuantifiedMineral} from "@/types";
import {IValidationService} from "@/services/calculation/abstract/IValidationService";

export interface IOutputResolutionStrategy {
	resolve(
		targetMb: number,
		normalizedComponents: NormalizedComponent[],
		normalizedInventory: Map<string, QuantifiedMineral[]>,
		flagValues: FlagValues | undefined,
		calculationFn: (amount: number) => CalculationOutput | null,
		validationService: IValidationService
	): CalculationOutput;
}
