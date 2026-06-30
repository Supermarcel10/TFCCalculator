import {QuantifiedMineral} from "@/types";
import {IValidationService, ValidationResult} from "./abstract/IValidationService";
import {OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {DataMapperService, DataServiceError} from "@/services/data/dataMapperService";
import {DataReaderService} from "@/services/data/dataReaderService";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";



export class ValidationService implements IValidationService {
	#intervalMb: number | null = null;

	setIntervalMb(intervalMb: number) : void {
		this.#intervalMb = intervalMb;
	}

	validateInput(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>
	) : ValidationResult {
		if (!Number.isFinite(this.#intervalMb) || this.#intervalMb <= 0 || !Number.isInteger(this.#intervalMb)) {
			return {
				isValid : false,
				error : {
					status : OutputCode.BAD_REQUEST,
					amountMb : 0,
					usedMinerals : [],
					statusContext : "intervalMb must be a positive integer"
				}
			};
		}
		if (!Number.isFinite(targetMb) || targetMb <= 0 || !Number.isInteger(targetMb)) {
			return {
				isValid : false,
				error : {
					status : OutputCode.BAD_REQUEST,
					amountMb : 0,
					usedMinerals : [],
					statusContext : "targetMb must be a positive integer"
				}
			};
		}

		if (!normalizedComponents?.length) {
			return {
				isValid : false,
				error : {
					status : OutputCode.BAD_REQUEST,
					amountMb : 0,
					usedMinerals : [],
					statusContext : "components are required"
				}
			};
		}

	  let totalAvailableFromRecipe = 0;
    for (const {component, minPct} of normalizedComponents) {
 			const minMb = Math.ceil((minPct / 100) * targetMb);
 			const available = this.totalAvailableForComponent(component, normalizedInv);
      totalAvailableFromRecipe += available;

 			if (available < minMb) {
				return {
 					isValid : false,
 					error : {
  						status : OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB,
  						statusContext : `Not enough ${component} for minimum requirement (`
								+ `${minMb - available}`
								+ "mB or "
								+ `${
									(minMb - available) - Math.floor(minMb - available) <= 1.0 ? 
										((minMb - available) / this.#intervalMb).toFixed(0) :
										((minMb - available) / this.#intervalMb).toFixed(3)
								}`
								+ " ingot(s) short)",
  						amountMb : 0,
  						usedMinerals : []
 					}
				};
		  }
   	}

		if (totalAvailableFromRecipe < targetMb) {
			return {
                isValid: false,
                error: {
                    status: OutputCode.INSUFFICIENT_TOTAL_MB,
                    statusContext: "Not enough total material available (" +
										 + `${targetMb - totalAvailableFromRecipe}`
										 + "mB or "
										 + `${
											(targetMb - totalAvailableFromRecipe) - Math.floor(targetMb - totalAvailableFromRecipe) <= 1.0 ? 
												((targetMb - totalAvailableFromRecipe) / this.#intervalMb).toFixed(0) :
												((targetMb - totalAvailableFromRecipe) / this.#intervalMb).toFixed(3)
										}`
										 + " ingots short)",
                    amountMb: 0,
                    usedMinerals: []
                }
            };
		}

		return {isValid : true};
	}

	private totalAvailableForComponent(
			component : string,
			invByComponent : Map<string, QuantifiedMineral[]>
	) : number {
		const arr = invByComponent.get(component) ?? [];
		let total = 0;

		for (const qm of arr) {
			total += qm.yield * qm.quantity;
		}

		return total;
	}
}
