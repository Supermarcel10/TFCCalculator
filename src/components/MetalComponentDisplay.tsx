import {ErrorComponent} from "@/components/ErrorComponent";
import {InventoryList} from "@/components/InventoryList";
import {OutputResult} from "@/components/OutputResult";
import {Tooltip} from "@/components/Tooltip";
import {DesiredOutputTypes, Mineral, QuantifiedMineral, SmeltingComponent} from "@/types";
import React, {useCallback, useEffect, useMemo, useState} from "react";
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
	const [allMinerals, setAllMinerals] = useState<Map<string, QuantifiedMineral[]>>(new Map());
	const [inventory, setInventory] = useState<QuantifiedMineral[]>([]);
	const [mbConstants, setMbConstants] = useState<Record<string, number> | null>(null);
	const [unit, setUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [calculationUnit, setCalculationUnit] = useState<DesiredOutputTypes>(DesiredOutputTypes.Ingot);
	const [desiredOutputInUnits, setDesiredOutputInUnits] = useState<number>(0);
	const [closestAlternative, setClosestAlternative] = useState<boolean>(true);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [result, setResult] = useState<CalculationOutput | null>(null);
	const [error, setError] = useState<Error | string | null>(null);
	const [consumedSnapshot, setConsumedSnapshot] = useState<QuantifiedMineral[] | null>(null);
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
				setAllMinerals(new Map(
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

	const inventoryMap = useMemo(() => {
		const map = new Map<string, QuantifiedMineral[]>();
		for (const entry of inventory) {
			const key = entry.produces;
			const existing = map.get(key) ?? [];
			map.set(key, [...existing, entry]);
		}
		return map;
	}, [inventory]);

	useEffect(() => {
		if (!components || !mbConstants || isLoading) return;

		const hasMinerals = inventory.length > 0;

		if (!hasMinerals) {
			setResult(null);
			setError(null);
			return;
		}

		const timeoutId = setTimeout(() => {
			setCalculationUnit(unit);

			const desiredOutputInMb = desiredOutputInUnits * (mbConstants[unit] ?? 1);

			const flags: Flags | undefined = closestAlternative ? Flags.CLOSEST_ALTERNATIVE : undefined;
			const flagValues: FlagValues | undefined = closestAlternative
				? { intervalMb: mbConstants[unit] ?? 100 }
				: undefined;

			try {
				setResult(outputCalculator.calculateSmeltingOutput(
					desiredOutputInMb,
					components,
					inventoryMap,
					flags,
					flagValues
				));
			} catch (err) {
				setError(`Failed to calculate! ${err}`);
				console.error("Error calculating:", err);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [inventory, inventoryMap, desiredOutputInUnits, unit, closestAlternative, components, mbConstants, isLoading]);

	const handleDesiredTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
		setDesiredOutputInUnits(isNaN(value) ? 0 : value);
	};

	const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setUnit(e.target.value as DesiredOutputTypes);
	};

	const handleUpdateQuantity = useCallback((name: string, quantity: number) => {
		setConsumedSnapshot(null);
		if (quantity <= 0) {
			setInventory(prev => prev.filter(m => m.name !== name));
		} else {
			setInventory(prev => prev.map(m => m.name === name ? { ...m, quantity } : m));
		}
	}, []);

	const handleDelete = useCallback((name: string) => {
		setConsumedSnapshot(null);
		setInventory(prev => prev.filter(m => m.name !== name));
	}, []);

	const handleAddMineral = useCallback((mineral: QuantifiedMineral) => {
		setConsumedSnapshot(null);
		setInventory(prev => {
			const existing = prev.find(m => m.name === mineral.name);
			if (existing) {
				return prev.map(m => m.name === mineral.name
					? { ...m, quantity: m.quantity + mineral.quantity }
					: m
				);
			}
			return [...prev, mineral];
		});
	}, []);

	const handleUseMinerals = () => {
		if (!result || result.status !== OutputCode.SUCCESS) return;

		const snapshot = inventory.map(m => ({ ...m }));
		const newInventory = inventory.map(m => ({ ...m }));

		for (const used of result.usedMinerals) {
			const entry = newInventory.find(m => m.name === used.name);
			if (entry) {
				entry.quantity -= used.quantity;
			} else {
				setError(`Mineral ${used.name} not found in inventory. This indicates a calculation bug!`);
				return;
			}
		}

		for (const entry of newInventory) {
			if (entry.quantity < 0) {
				setError(`Inventory for ${entry.name} is negative. This indicates a calculation bug!`);
				return;
			}
		}

		const filtered = newInventory.filter(m => m.quantity > 0);

		setConsumedSnapshot(snapshot);
		setInventory(filtered);
		setToastMessage("Minerals consumed from inventory!");
	};

	const handleUndo = () => {
		if (!consumedSnapshot) return;

		setInventory(consumedSnapshot);
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
				<h2 className="text-xl text-center font-bold mb-4">INVENTORY</h2>
				<p className="text-lg text-center mb-8">Enter all available minerals in your inventory!</p>

				{components && (
					<InventoryList
						components={components}
						allMinerals={allMinerals}
						inventory={inventory}
						inventoryMap={inventoryMap}
						onUpdateQuantity={handleUpdateQuantity}
						onDelete={handleDelete}
						onAddMineral={handleAddMineral}
						onMergeToast={(mineralName) => setToastMessage(`Merged with existing ${mineralName} entry!`)}
					/>
				)}
			</div>}

			{toastMessage != null && (
				<Toast message={toastMessage} onClose={() => setToastMessage(null)} />
			)}

			{(consumedSnapshot != null || (result != null && result.status === OutputCode.SUCCESS && result.usedMinerals.length > 0)) && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur  bg-gray-400/20 rounded-xl inline-flex">
					<div className="flex justify-center gap-4 p-4">
						{consumedSnapshot != null && (
							<button
								onClick={handleUndo}
								className="px-6 py-3 rounded transition-colors bg-amber-500 hover:bg-amber-600 text-white"
							>
								UNDO
							</button>
						)}
						{result != null && result.status === OutputCode.SUCCESS && result.usedMinerals.length > 0 && (
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
