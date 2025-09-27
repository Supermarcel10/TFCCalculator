import {IStrategySelector, StrategyResult} from "@/services/calculation/abstract/IStrategySelector";
import {Flags, FlagValues, OutputCode} from "@/services/calculation/abstract/ICalculationService";


export class StrategySelector implements IStrategySelector {
	validateFlags(
			flags? : Flags,
			flagValues? : FlagValues
	) : StrategyResult {
		return {
			status : OutputCode.SUCCESS
		};
	}
}
