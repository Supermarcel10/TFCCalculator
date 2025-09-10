import { BaseGameVersion, GameVersions, VersionType } from "@/types/gameversions";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorComponent } from "./ErrorComponent";

export function GameVersionSelector() {
	const router = useRouter();
	const [data, setData] = useState<GameVersions | null>(null);

	const [selectedType, setSelectedType] = useState<VersionType>("modpack");
	const [selectedDisplayName, setSelectedDisplayName] = useState<string | null>(null);
	const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPackages = async () => {
			const response = await fetch("/api/options");
			if (!response.ok) throw new Error("Failed to fetch data");
			return response;
		};

		fetchPackages()
			.then(async (response) => {
				const data = await response.json();
				setData(data);

				// Auto-select first supported package if available
				if (data.modpack && Object.keys(data.modpack).length > 0) {
					const firstModpack = Object.keys(data.modpack)[0];
					setSelectedDisplayName(firstModpack);
					if (data.modpack[firstModpack].length > 0) {
						setSelectedVersion(data.modpack[firstModpack][0].version);
					}
				}
			})
			.catch((err) => {
				setError("Failed to load data");
				console.error(err);
			})
			.finally(() => setIsLoading(false));
	}, []);

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newType = e.target.value as VersionType;
		setSelectedType(newType);
		setSelectedDisplayName(null);
		setSelectedVersion(null);

		if (!data) return;

		const baseGameVersions = data[newType] as unknown as Record<string, BaseGameVersion[]>;

		if (baseGameVersions && Object.keys(baseGameVersions).length > 0) {
			const firstGroupKey = Object.keys(baseGameVersions)[0];
			const versions = baseGameVersions[firstGroupKey];

			setSelectedDisplayName(firstGroupKey);

			if (versions && versions.length > 0) {
				setSelectedVersion(versions[0].version);
			}
		}
	};

	const handleBaseGameVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newDisplayName = e.target.value;
		setSelectedDisplayName(newDisplayName);
		if (data && newDisplayName) {
			const versions = (data[selectedType] as unknown as Record<string, BaseGameVersion[]>)[newDisplayName];
			if (versions.length > 0) {
				setSelectedVersion(versions[0].version);
			}
		}
	};

	const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedVersion(e.target.value);
	};

	const handleCalculate = () => {
		if (!selectedDisplayName || !selectedVersion || !data) return;

		const selectedItem = (data[selectedType] as unknown as Record<string, BaseGameVersion[]>)[selectedDisplayName].find(
			item => item.version === selectedVersion
		);

		if (!selectedItem) return;

		const versionPath = `${selectedItem.gameVersion}_${selectedItem.version}`;
		router.push(`/${selectedType}/${selectedItem.id}/${versionPath}/metals`);
	};

	if (isLoading) return <LoadingSpinner />;
	if (error || !data) return <ErrorComponent error={error} />;

	const currentItems = (data[selectedType] as unknown as Record<string, BaseGameVersion[]>);
	const currentVersion = selectedDisplayName ? currentItems[selectedDisplayName] : [];

	return (
		<div className="container mx-auto px-4 py-1">
			<div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
				<div className="flex flex-col sm:flex-row justify-center w-full gap-4">
					<select
						value={selectedType}
						onChange={handleTypeChange}
						className="w-full sm:w-1/4 p-2 rounded border border-teal-500 bg-black text-teal-100"
						aria-label="Select type"
					>
						<option value="modpack">Modpack</option>
						<option value="mod">Mod</option>
					</select>

					<select
						value={selectedDisplayName ?? ""}
						onChange={handleBaseGameVersionChange}
						className="w-full sm:w-1/2 p-2 rounded border border-teal-500 bg-black text-teal-100"
						aria-label="Select modpack/mod"
					>
						{Object.keys(currentItems).map((displayName) => (
							<option key={displayName} value={displayName}>
								{displayName}
							</option>
						))}
					</select>

					<select
						value={selectedVersion ?? ""}
						onChange={handleVersionChange}
						className="w-full sm:w-1/4 p-3 rounded border border-teal-500 bg-black text-teal-100"
						aria-label="Select version"
					>
						{currentVersion.map((baseGameVersion) => (
							<option key={baseGameVersion.version} value={baseGameVersion.version}>
								{baseGameVersion.version}
							</option>
						))}
					</select>
				</div>

				<button
					onClick={handleCalculate}
					disabled={!selectedType || !selectedDisplayName || !selectedVersion}
					className="w-full sm:w-auto px-14 py-3 my-4 rounded primary"
					aria-label="Go to calculator"
				>
					Start
				</button>
			</div>
		</div>
	);
}