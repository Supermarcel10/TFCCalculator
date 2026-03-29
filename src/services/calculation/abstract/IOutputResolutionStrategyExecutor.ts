import { QuantifiedMineral } from "@/types";
import { NormalizedComponent } from "./IInputNormalizationService";
import { CalculationOutput, Flags, FlagValues } from "./IOutputCalculator";


export interface IOutputResolutionStrategyExecutor {
  executeStrategy(
	  targetMb : number,
	  normalizedComponents : NormalizedComponent[],
	  normalizedInventory : Map<string, QuantifiedMineral[]>,
	  flags? : Flags,
		flagValues? : FlagValues,
	) : CalculationOutput
}
