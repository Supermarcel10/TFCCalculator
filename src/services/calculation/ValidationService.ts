import {QuantifiedMineral} from "@/types";
import {IValidationService, ValidationResult} from "./abstract/IValidationService";
import {OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {NormalizedComponent} from "@/services/calculation/abstract/IInputNormalizationService";


export class ValidationService implements IValidationService {
	validateInput(
			targetMb : number,
			normalizedComponents : NormalizedComponent[],
			normalizedInv : Map<string, QuantifiedMineral[]>
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

		// Total available mB must be >= targetMb
		let totalAvailableFromRecipe = 0;
		for (const {component} of normalizedComponents) {
			totalAvailableFromRecipe += this.totalAvailableForComponent(component, normalizedInv);
		}
		if (totalAvailableFromRecipe < targetMb) {
			return {
				isValid : false,
				error : {
					status : OutputCode.INSUFFICIENT_TOTAL_MB,
					statusContext : "Not enough total material available",
					amountMb : 0,
					usedMinerals : []
				}
			};
		}

		// Total available mB for each Component must be >= minPct
		for (const {component, minPct} of normalizedComponents) {
			const minMb = Math.ceil((minPct / 100) * targetMb);
			const available = this.totalAvailableForComponent(component, normalizedInv);
			if (available < minMb) {
				return {
					isValid : false,
					error : {
						status : OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB,
						statusContext : `Not enough ${component} for minimum requirement`,
						amountMb : 0,
						usedMinerals : []
					}
				};
			}
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
