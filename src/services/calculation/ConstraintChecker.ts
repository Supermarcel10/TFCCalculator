import {QuantifiedMineral, SmeltingComponent} from "@/types";
import {ConstraintResult, IConstraintChecker} from "@/services/calculation/abstract/IConstraintChecker";
import {OutputCode} from "@/services/calculation/abstract/ICalculationService";


export class ConstraintChecker implements IConstraintChecker {
	checkEntryConstraints(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>
	) : ConstraintResult {
		const targetMbValid = this.checkValidUnsignedInteger(targetMb) && targetMb !== 0;
		if (!targetMbValid) {
			return {
				status : OutputCode.BAD_REQUEST,
				statusContext : "Parameter targetMb must be a positive integer"
			};
		}

		if (components.length === 0) {
			return {
				status : OutputCode.BAD_REQUEST,
				statusContext : "No components have been provided"
			};
		}

		let totalAvailableMb = this.getTotalAvailableMb(components, availableMinerals);
		if (totalAvailableMb < targetMb) {
			return {
				status : OutputCode.INSUFFICIENT_TOTAL_MB,
				statusContext : "Not enough total material available"
			};
		}

		// Total available mB for each component must be >= min
		for (const {mineral, min} of components) {
			const availableMb = this.totalAvailableForComponent(mineral, availableMinerals);
			const minMb = Math.ceil((min / 100) * targetMb);
			if (availableMb < minMb) {
				return {
					status : OutputCode.INSUFFICIENT_SPECIFIC_MINERAL_MB,
					statusContext : `Not enough ${mineral} for minimum requirement`
				};
			}
		}

		return {
			status : OutputCode.SUCCESS
		};
	}

	private checkValidUnsignedInteger(num : number) {
		return Number.isInteger(num) && num >= 0;
	}

	private getTotalAvailableMb(
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>
	) : number {
		return components
				.reduce(
						(sum, {mineral}) => sum + this.totalAvailableForComponent(mineral, availableMinerals),
						0
				);
	}

	/**
	 * Compute total available mB for the given component from availableMinerals.
	 *
	 * @param component The component to compute total available mB for.
	 * @param availableMinerals Map with component as key and all minerals producing it as value.
	 */
	private totalAvailableForComponent(component : string, availableMinerals : Map<string, QuantifiedMineral[]>) : number {
		const quantifiedMinerals = availableMinerals.get(component) ?? [];
		let total = 0;

		for (const quantifiedMineral of quantifiedMinerals) {
			total += quantifiedMineral.yield * quantifiedMineral.quantity;
		}

		return total;
	}
}
