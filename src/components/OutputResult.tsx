import React from "react";
import {DesiredOutputTypes} from "@/types";
import {CalculationResult, OutputCode} from "@/services/calculation/abstract/ICalculationService";


const successFormatting = "bg-green-700 text-white";
const failureFormatting = "bg-yellow-400 text-black";

interface OutputResultProps {
	output : CalculationResult | null;
	unit : DesiredOutputTypes;
	conversions : Record<string, number>;
}

export function OutputResult({output, unit, conversions} : Readonly<OutputResultProps>) {
	if (!output) return;

	const success = output.status === OutputCode.SUCCESS;
	return (
			<div className={`rounded-lg shadow p-6 ${success ? successFormatting : failureFormatting}`}>
				<h2 className="text-xl text-center font-bold mb-4">OUTPUT</h2>
				{GetInnerOutput(output, unit, conversions)}
			</div>
	)
}

function GetInnerOutput(output : CalculationResult, unit : DesiredOutputTypes, conversions : Record<DesiredOutputTypes, number>) {
	const success = output.status === OutputCode.SUCCESS;

	const displayQuantity = output.amountMb / (conversions[unit] ?? 1);
	const plural = displayQuantity > 1 ? "s" : "";

	if (!success) return (<p className="text-lg text-center">{output.statusContext}!</p>)

	return (
			<div>
				<p className="text-xl text-center">Yields exactly {displayQuantity} {unit}{plural}!</p>
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
