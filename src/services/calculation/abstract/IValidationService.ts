import {QuantifiedMineral} from "@/types";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";
import {CalculationOutput} from "@/services/calculation/abstract/IOutputCalculator";


export interface IValidationService {
	validateInput(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>,
			intervalMb? : number,
	) : ValidationResult;
}

export interface ValidationResult {
	isValid : boolean;
	error? : CalculationOutput;
}
