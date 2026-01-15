import {IOutputResolutionStrategy} from "@/services/calculation/abstract/IOutputResolutionStrategy";
import {CalculationOutput, FlagValues, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";

/**
 * Strategy for exact matching only.
 * This is the default behavior when no alternative searching is enabled.
 * If the exact target amount cannot be produced, returns UNFEASIBLE.
 */
export class ExactMatchResolutionStrategy implements IOutputResolutionStrategy {
	resolve(
		targetMb: number,
		_: FlagValues | undefined,
		calculationFn: (amount: number) => CalculationOutput | null
	): CalculationOutput {
		const result = calculationFn(targetMb);

		if (result) {
			return result;
		}

		return {
			status: OutputCode.UNFEASIBLE,
			statusContext: "Could not find valid combination of materials",
			amountMb: 0,
			usedMinerals: []
		};
	}
}
