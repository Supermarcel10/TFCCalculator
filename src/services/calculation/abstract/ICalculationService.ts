import {QuantifiedMineral, SmeltingComponent} from "@/types";


/**
 * Flags for enabling and disabling functionality.
 * Defined as an enum flag.
 * @see FlagValues
 */
export enum Flags {
	/**
	 * Enables logic for finding the closest alternative that can be made.
	 *
	 * For e.g. If the user requested 4 ingots valued at 400mB, but can only make 300mB as determined by the algorithm,
	 * this result would be sent back as a success instead.
	 *
	 * Requires the {@link intervalMb} value to be present in {@link FlagValues}.
	 */
	CLOSEST_ALTERNATIVE = 1,
}

/**
 * Values for enabled flags.
 * Each flag documentation defines which flag value is mandatory.
 * @see Flag
 */
export interface FlagValues {
	/**
	 * The size of specified target output type.
	 *
	 * For e.g. a modpack where an ingot is 100mB would define the interval as 100mB.
	 */
	intervalMb? : number;
}

/**
 * Result of the calculation.
 */
export interface CalculationResult {
	/**
	 * The status of the calculation.
	 * Some statuses may output additional context in {@link statusContext}.
	 * @see statusContext
	 */
	status : OutputCode;
	/**
	 * Additional context of the status output.
	 */
	statusContext? : string;
	/**
	 * The amount that has been produced.
	 * This may be different from the targetMb parameter in {@link calculateSmeltingOutput} if flags have been applied.
	 * @see Flag
	 */
	amountMb : number;
	/**
	 * The collection of used minerals to produce the outputs, with their quantities.
	 */
	usedMinerals : QuantifiedMineral[];
}

/**
 * Status of the calculation.
 * Some statuses may provide additional context via `statusContext`.
 */
export enum OutputCode {
	/**
	 * It is feasible to create the desired output.
	 */
	SUCCESS,
	/**
	 * Request has missing values or contains invalid input from the caller.
	 */
	BAD_REQUEST,
	/**
	 * Insufficient amount of minerals in total to achieve desired amount.
	 */
	INSUFFICIENT_TOTAL_MB,
	/**
	 * Insufficient amount of {@link statusContext} specified mineral to
	 * meet minimum component criteria for the desired amount.
	 */
	INSUFFICIENT_SPECIFIC_MINERAL_MB,
	/**
	 * Enough resources exist, but it is impossible to create desired
	 * amount taking into account all flags.
	 */
	UNFEASIBLE
}

export interface ICalculationService {
	/**
	 * Calculate a smelting output feasibility based on the component constraints,
	 * targeting a production of a certain amount of millibuckets.
	 *
	 * Method should not fail or error.
	 *
	 * @param targetMb The amount to produce in millibuckets as part of the calculation.
	 * @param components The components required.
	 * @param availableMinerals Collection of all available minerals.
	 * @param flags Flags to enable functionality as part of the calculation flow.
	 * @param flagValues Values for the given flags.
	 */
	calculateSmeltingOutput(
			targetMb : number,
			components : SmeltingComponent[],
			availableMinerals : Map<string, QuantifiedMineral[]>,
			flags? : Flags,
			flagValues? : FlagValues
	) : CalculationResult;
}
