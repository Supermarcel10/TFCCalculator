import {QuantifiedMineral} from "@/types";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";
import {CalculationOutput} from "@/services/calculation/abstract/IOutputCalculator";


export interface IValidationService {
	setIntervalMb(intervalMb: number) : void

	resetIntervalMb() : void

	validateInput(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>
	) : ValidationResult;
}

export interface ValidationResult {
	isValid : boolean;
	error? : CalculationOutput;
}
