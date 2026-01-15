import {CalculationOutput, FlagValues} from "@/services/calculation/abstract/IOutputCalculator";


export interface IOutputResolutionStrategy {
	resolve(
		targetMb: number,
		flagValues: FlagValues | undefined,
		calculationFn: (amount: number) => CalculationOutput | null
	): CalculationOutput;
}
