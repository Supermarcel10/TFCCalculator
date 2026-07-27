import {ErrorComponent} from "@/components/ErrorComponent";
import {MineralAccordion} from "@/components/MineralAccordion";
import {OutputResult} from "@/components/OutputResult";
import {Tooltip} from "@/components/Tooltip";
import {capitaliseFirstLetterOfEachWord} from "@/functions/utils";
import {DesiredOutputTypes, Mineral, QuantifiedMineral, SmeltingComponent} from "@/types";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {ApiResponse as MetalsApiResponse} from "@/app/api/[type]/[id]/[version]/metal/[metal]/route";
import {ApiResponse as ConstantsApiResponse} from "@/app/api/[type]/[id]/[version]/constants/route";
import {CalculationOutput, Flags, FlagValues, OutputCode} from "@/services/calculation/abstract/IOutputCalculator";
import {OutputCalculator} from "@/services/calculation/OutputCalculator";
import {Toast} from "@/components/Toast";


interface MetalDisplayProps {
	metal?: string;
}

export function MetalComponentDisplay({ metal }: Readonly<MetalDisplayProps>) {
	const { type, id, version } = useParams();

	const outputCalculator = new OutputCalculator();

	const [components, setComponents] = useState<SmeltingComponent[] | null>(null);
	const [minerals, setMinerals] = useState<Map<string, QuantifiedMineral[]>>(new Map());
	const [mbConstants, setMbConstants] = useState<Record<string, number> | null>(null);
	const [unit, setUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [calculationUnit, setCalculationUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [desiredOutputInUnits, setDesiredOutputInUnits] = useState<number>(0);
	const [closestAlternative, setClosestAlternative] = useState<boolean>(true);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [result, setResult] = useState<CalculationOutput | null>(null);
	const [error, setError] = useState<Error | string | null>(null);
	const [consumedSnapshot, setConsumedSnapshot] = useState<Map<string, QuantifiedMineral[]> | null>(null);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

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

	useEffect(() => {
		if (!components || !mbConstants || isLoading) return;

		const hasMinerals = [...minerals.values()].some(arr => arr.some(m => m.quantity > 0));

		if (!hasMinerals) {
			setResult(null);
			setError(null);
			return;
		}

		const timeoutId = setTimeout(() => {
			setConsumedSnapshot(null);
			setCalculationUnit(unit);

			const mineralWithQuantities: Map<string, QuantifiedMineral[]> = new Map();

			for (const [category, mineralArray] of minerals) {
				const nonZeroMinerals = mineralArray.filter(m => m.quantity > 0);

				if (nonZeroMinerals.length > 0) {
					mineralWithQuantities.set(category, nonZeroMinerals);
				}
			}

			const desiredOutputInMb = desiredOutputInUnits * (mbConstants[unit] ?? 1);

			const flags: Flags | undefined = closestAlternative ? Flags.CLOSEST_ALTERNATIVE : undefined;
			const flagValues: FlagValues | undefined = closestAlternative
				? { intervalMb: mbConstants[unit] ?? 100 }
				: undefined;

			try {
				setResult(outputCalculator.calculateSmeltingOutput(
					desiredOutputInMb,
					components,
					mineralWithQuantities,
					flags,
					flagValues
				));
			} catch (err) {
				setError(`Failed to calculate! ${err}`);
				console.error("Error calculating:", err);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [minerals, desiredOutputInUnits, unit, closestAlternative, components, mbConstants, isLoading]);

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

	const deepCloneMinerals = (source: Map<string, QuantifiedMineral[]>): Map<string, QuantifiedMineral[]> =>
		new Map(
			[...source.entries()].map(([key, values]) => [
				key,
				values.map(v => ({ ...v }))
			])
		);

	const handleUseMinerals = () => {
		if (!result || result.status !== OutputCode.SUCCESS) return;

		const snapshot = deepCloneMinerals(minerals);
		const newMinerals = deepCloneMinerals(minerals);

		for (const used of result.usedMinerals) {
			let found = false;
			for (const [, mineralArray] of newMinerals.entries()) {
				const mineral = mineralArray.find(m => m.name === used.name);
				if (mineral) {
					mineral.quantity -= used.quantity;
					found = true;
					break;
				}
			}

			if (!found) {
				setError(`Mineral ${used.name} not found in inventory. This indicates a calculation bug!`);
				return;
			}
		}

		for (const [, mineralArray] of newMinerals.entries()) {
			for (const mineral of mineralArray) {
				if (mineral.quantity < 0) {
					setError(`Inventory for ${mineral.name} is negative. This indicates a calculation bug!`);
					return;
				}
			}
		}

		setConsumedSnapshot(snapshot);
		setMinerals(newMinerals);
		setToastMessage("Minerals consumed from inventory!");
	};

	const handleUndo = () => {
		if (!consumedSnapshot) return;

		setMinerals(consumedSnapshot);
		setConsumedSnapshot(null);
		setToastMessage("Inventory restored!");
	};

	const isReadyToShowInputs: boolean =
		desiredOutputInUnits !== 0
		&& !isLoading;

	const isReadyToShowOutputs: boolean =
		desiredOutputInUnits !== 0
		&& result != null
		&& !error;

	return (
		<div className="container mx-auto p-4 pb-20 grid grid-cols-1 gap-6">
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

					<label className="flex items-center gap-2 text-gray-700 mt-4">
						<input
							type="checkbox"
							checked={closestAlternative}
							onChange={(e) => setClosestAlternative(e.target.checked)}
							className="w-4 h-4"
						/>
						Allow closest alternative
						<Tooltip content="If enabled, when exact output cannot be achieved, the closest achievable output is shown instead. This will search for higher than desired quantity before searching lower." />
					</label>
				</div>
			</div>

			<ErrorComponent error={error} />
			{isReadyToShowOutputs
					&& mbConstants != null
					&& <OutputResult
							output={result}
							unit={calculationUnit}
							conversions={mbConstants}
							desiredMb={desiredOutputInUnits * (mbConstants[unit] ?? 1)}
						/>
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
						/>
					);
				})}

			</div>}

			{toastMessage != null && (
				<Toast message={toastMessage} onClose={() => setToastMessage(null)} />
			)}

			{(consumedSnapshot != null || (result != null && result.status === OutputCode.SUCCESS && result.usedMinerals.length > 0)) && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur  bg-gray-400/20 rounded-xl inline-flex">
					<div className="flex justify-center gap-4 p-4">
						{consumedSnapshot != null ? (
							<button
								onClick={handleUndo}
								className="px-6 py-3 rounded transition-colors bg-amber-500 hover:bg-amber-600 text-white"
							>
								UNDO
							</button>
						) : (
  						<button
  							onClick={handleUseMinerals}
  							className="px-6 py-3 rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white"
  						>
    						CONSUME
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
