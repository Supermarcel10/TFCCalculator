import React from "react";
import {DesiredOutputTypes} from "@/types";
import {CalculationOutput, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";


const successFormatting = "bg-green-200 text-black";
const alternativeFormatting = "bg-teal-200 text-black";
const failureFormatting = "bg-yellow-200 text-black";

interface OutputResultProps {
	output : CalculationOutput | null;
	unit : DesiredOutputTypes;
	conversions : Record<string, number>;
	desiredMb : number;
}

export function OutputResult({output, unit, conversions, desiredMb} : Readonly<OutputResultProps>) {
	if (!output) return;

	const success = output.status === OutputCode.SUCCESS;
	const isAlternative = success && output.amountMb !== desiredMb;

	const formatting = isAlternative ? alternativeFormatting : (success ? successFormatting : failureFormatting);

	return (
			<div className={`rounded-lg shadow p-6 ${formatting}`}>
				<h2 className="text-xl text-center font-bold mb-4">OUTPUT</h2>
				{GetInnerOutput(output, unit, conversions, isAlternative)}
			</div>
	)
}

function GetInnerOutput(output : CalculationOutput, unit : DesiredOutputTypes, conversions : Record<DesiredOutputTypes, number>, isAlternative : boolean) {
	const success = output.status === OutputCode.SUCCESS;

	const displayQuantity = output.amountMb / (conversions[unit] ?? 1);
	const plural = displayQuantity > 1 ? "s" : "";

	if (!success) return (<p className="text-lg text-center">{output.statusContext}!</p>)

	const message = isAlternative
		? `Closest alternative: ${displayQuantity} ${unit}${plural}`
		: `Yields exactly ${displayQuantity} ${unit}${plural}!`;

	return (
			<div>
				<p className="text-xl text-center">{message}</p>
				<div className="p-4">
					<div className="flex flex-wrap justify-center gap-4">
						{output.usedMinerals.map(usedMineral => {
							const mineralName = usedMineral.name;
							const mineralQuantity = usedMineral.quantity;

							return (
									<div key={mineralName}
									     className="bg-white text-black rounded-lg flex flex-col text-center w-full
								     md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]">
										<p className="mt-3 text-lg">{mineralName}</p>
										<p className="mb-3 text-sm">x{mineralQuantity}</p>
									</div>
							)
						})}
					</div>
				</div>
			</div>
	)
}
