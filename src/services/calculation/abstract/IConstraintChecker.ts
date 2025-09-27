import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {OutputCode} from "@/services/calculation/abstract/ICalculationService";


export interface ConstraintResult {
	status : OutputCode;
	statusContext? : string;
}

export interface IConstraintChecker {
	checkEntryConstraints(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>
	) : ConstraintResult;
}