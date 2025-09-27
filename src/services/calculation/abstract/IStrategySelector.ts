import {Flags, FlagValues, OutputCode} from "@/services/calculation/abstract/ICalculationService";


export interface StrategyResult {
	status : OutputCode;
	statusContext? : string;
}

export interface IStrategySelector {
	validateFlags(
			flags? : Flags,
			flagValues? : FlagValues
	) : StrategyResult;
}
