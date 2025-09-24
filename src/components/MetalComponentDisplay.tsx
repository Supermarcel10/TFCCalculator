import {ErrorComponent} from "@/components/ErrorComponent";
import {MineralAccordion} from "@/components/MineralAccordion";
import {OutputResult} from "@/components/OutputResult";
import {capitaliseFirstLetterOfEachWord} from "@/functions/utils";
import {DesiredOutputTypes, Mineral, QuantifiedMineral, SmeltingComponent} from "@/types";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {ApiResponse as MetalsApiResponse} from "@/app/api/[type]/[id]/[version]/metal/[metal]/route";
import {ApiResponse as ConstantsApiResponse} from "@/app/api/[type]/[id]/[version]/constants/route";
import {CalculationResult, ICalculationService} from "@/services/calculation/abstract/ICalculationService";
import {CalculationService} from "@/services/calculation/CalculationService";


interface MetalDisplayProps {
	metal?: string;
}

export function MetalComponentDisplay({ metal }: Readonly<MetalDisplayProps>) {
	const { type, id, version } = useParams();

	const calculationService : ICalculationService = new CalculationService();

	const [components, setComponents] = useState<SmeltingComponent[] | null>(null);
	const [minerals, setMinerals] = useState<Map<string, QuantifiedMineral[]>>(new Map());
	const [mbConstants, setMbConstants] = useState<Record<string, number> | null>(null);
	const [unit, setUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [calculationUnit, setCalculationUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [desiredOutputInUnits, setDesiredOutputInUnits] = useState<number>(0);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCalculating, setIsCalculating] = useState<boolean>(false);
	const [result, setResult] = useState<CalculationResult | null>(null);
	const [error, setError] = useState<Error | string | null>(null);

	useEffect(() => {
		if (!metal) {
			return;
		}

		let metalsTask = fetch(`/api/${type}/${id}/${version}/metal/${metal}`)
	    .then(response => {
	        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	        return response.json() as Promise<MetalsApiResponse>;
	    })
			.then(data => {
				setComponents(data.components);
				setMinerals(new Map(
					Object.entries(data.minerals).map(([name, minerals] : [string, Mineral[]]) => [
						name,
						minerals.map(m => ({ ...m, quantity: 0 }))
					])
				));
			})
			.catch(error => {
				setError("Error fetching metal details");
				console.error("Error fetching metal details:", error);
			});

		let constantsTask = fetch(`/api/${type}/${id}/${version}/constants`)
		    .then(response => {
		        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		        return response.json() as Promise<ConstantsApiResponse>;
		    })
				.then(data => setMbConstants(data))
				.catch(error => {
					setError("Error fetching constants");
					console.error("Error fetching constants:", error);
				});

		Promise.all([metalsTask, constantsTask]).then(_ => setIsLoading(false));
	}, [type, id, version, metal]);

	const handleDesiredTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
		setDesiredOutputInUnits(isNaN(value) ? 0 : value);
	};

	const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setUnit(e.target.value as DesiredOutputTypes);
	};

	const handleMineralQuantityChange = (mineralName: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const newQty = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
		setMinerals(prevMinerals => updateMineralQuantity(prevMinerals, mineralName, newQty));
	};

	const updateMineralQuantity = (
		prevMinerals: Map<string, QuantifiedMineral[]>,
		mineralName: string,
		newQuantity: number
	): Map<string, QuantifiedMineral[]> => {
		const newMap = new Map(prevMinerals);

		for (const [componentName, mineralArray] of newMap.entries()) {
			const updatedMinerals = [...mineralArray];

			for (let i = 0; i < updatedMinerals.length; i++) {
				if (updatedMinerals[i].name === mineralName) {
					updatedMinerals[i] = {
						...updatedMinerals[i],
						quantity: newQuantity
					};
				}
			}

			newMap.set(componentName, updatedMinerals);
		}

		return newMap;
	};

	const handleCalculate = async () => {
		if (!components || !minerals || isCalculating || !mbConstants) {
			return;
		}

		setIsCalculating(true);
		setCalculationUnit(unit);

		// TODO: Decouple this somehow into a more generic reusable method of some form?
		const mineralWithQuantities: Map<string, QuantifiedMineral[]> = new Map();

		// Keep non-zero quantities
		for (const [category, mineralArray] of minerals) {
			const nonZeroMinerals = mineralArray.filter(m => m.quantity > 0);

			if (nonZeroMinerals.length > 0) {
				mineralWithQuantities.set(category, nonZeroMinerals);
			}
		}
		// END TODO

		const desiredOutputInMb = desiredOutputInUnits * (mbConstants[unit] ?? 1)

		const result = calculationService.calculateSmeltingOutput(desiredOutputInMb, components, mineralWithQuantities);
		setResult(result);
		setIsCalculating(false);
	};

	const handleKeyPress = async (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			await handleCalculate();
		}
	};

	const isReadyToShowInputs: boolean =
		desiredOutputInUnits !== 0
		&& !isLoading;

	const isReadyToShowOutputs: boolean =
		desiredOutputInUnits !== 0
		&& result != null
		&& !error;

	return (
		<div className="container mx-auto p-4 grid grid-cols-1 gap-6">
			<div className="bg-white text-black rounded-lg shadow p-6">
				<h2 className="text-xl text-center font-bold mb-4">CONSTRAINTS</h2>
				<p className="text-lg text-center mb-8">Enter any constraints and target ingot count!</p>

				{/* Count Input */}
				{/* TODO: Investigate some issues with dark reader related to this */}
				<div className="mb-6">
					<label htmlFor="desiredOutputCount" className="block mb-2 text-gray-700">Desired Quantity</label>
					<div className="flex">
						<input
							type="number"
							id="desiredOutputCount"
							value={desiredOutputInUnits === 0 ? "" : desiredOutputInUnits}
							placeholder="0"
							onChange={handleDesiredTargetChange}
							onKeyDown={handleKeyPress}
							min="0"
							className="flex-1 p-2 rounded-l border border-r-0 border-gray-300 bg-white text-gray-700 no-spinners"
						/>
						<select
							value={unit}
							onChange={handleUnitChange}
							className="w-24 p-2 rounded-r border border-l-0 border-gray-300 bg-white text-gray-700"
							aria-label="unit"
						>
							<option value={DesiredOutputTypes.Ingot} aria-label="ingots">Ingot(s)</option>
							<option value={DesiredOutputTypes.Nugget} aria-label="nuggets">Nugget(s)</option>
							<option value={DesiredOutputTypes.Millibucket} aria-label="milli-bucket">mB</option>
						</select>
					</div>
				</div>
			</div>

			<ErrorComponent error={error} />
			{isReadyToShowOutputs
					&& mbConstants != null
					&& <OutputResult output={result} unit={calculationUnit} conversions={mbConstants} />
			}

			{isReadyToShowInputs && <div className="bg-white text-black rounded-lg shadow p-6">
				<h2 className="text-xl text-center font-bold mb-4">INPUT</h2>
				<p className="text-lg text-center mb-8">Enter all available minerals in your inventory!</p>

				{/* Minerals */}
				{components?.map(component => {
					const mineralName = component.mineral.toLowerCase();
					const componentMinerals = minerals.get(mineralName) ?? [];

					if (componentMinerals.length === 0) {
						return (
							<ErrorComponent
								key={mineralName}
								error={`Failed to retrieve mineral ${mineralName}`}
								className="mb-6"
							/>
						);
					}

					return (
						<MineralAccordion
							key={mineralName}
							title={capitaliseFirstLetterOfEachWord(mineralName)}
							minerals={componentMinerals}
							onQuantityChange={handleMineralQuantityChange}
							onInputKeyPress={handleKeyPress}
						/>
					);
				})}

				{/* Calculate Button */}
				<div className="mt-6 text-center">
					<button
						onClick={handleCalculate}
						disabled={isCalculating}
						className={`px-4 py-2 mt-6 rounded transition-colors ${isCalculating
							? "bg-gray-400 cursor-not-allowed"
							: "bg-green-600 hover:bg-green-700"
							} text-white`}
					>
						{isCalculating ? "Calculating..." : "Calculate"}
					</button>
				</div>
			</div>}
		</div>
	);
}
