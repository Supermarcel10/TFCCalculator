import {QuantifiedMineral} from "@/types";
import {IValidationService, ValidationResult} from "./abstract/IValidationService";
import {OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";


export class ValidationService implements IValidationService {
	validateInput(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>,
			intervalMb? : number,
	) : ValidationResult {
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
   						statusContext : `Not enough ${component} for minimum requirement. ${this.formatShortfall(minMb - available, intervalMb)}`,
   						amountMb : 0,
   						usedMinerals : []
  					}
				};
		  }
   	}

		if (totalAvailableFromRecipe < targetMb) {
			return {
				isValid : false,
				error : {
					status : OutputCode.INSUFFICIENT_TOTAL_MB,
					statusContext : `Not enough total material available. ${this.formatShortfall(targetMb - totalAvailableFromRecipe, intervalMb)}`,
					amountMb : 0,
					usedMinerals : []
				}
			};
		}

		return {isValid : true};
	}

	private formatShortfall(shortfallMb : number, intervalMb? : number) : string {
		if (!intervalMb || !Number.isFinite(intervalMb) || !Number.isInteger(intervalMb) || intervalMb <= 0) {
			return `You are ${shortfallMb}mB short`;
		}

		const ingots = Math.ceil(shortfallMb / intervalMb);
		const plural = ingots !== 1 ? 's' : '';

		return `You are ${shortfallMb}mB (about ${ingots} ingot${plural}) short`;
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
