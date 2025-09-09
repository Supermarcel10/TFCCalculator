import {RouteParams}                                                    from "@/types/gameversions";
import {Mineral, SmeltingComponent, SmeltingOutput, SmeltingOutputType} from "@/types";
import {IDataReaderService}                                             from "@/services/data/dataReaderService";
import {capitaliseFirstLetterOfEachWord, replaceUnderscoreWithSpace} from "@/functions/utils";


interface AvailableOutput {
	name: string;
	type: SmeltingOutputType;
}

export type AvailableOutputsResponse = AvailableOutput[];

export interface OutputDataResponse {
	components : SmeltingComponent[];
	minerals : Map<string, Mineral[]>;
}

export interface IDataMapperService {
	getAvailableOutputs(params : RouteParams) : Promise<AvailableOutputsResponse>
	getOutputData(params : RouteParams, outputName : string) : Promise<OutputDataResponse>
}

export class DataServiceError extends Error {
	constructor(
			public readonly status: number,
			message: string,
			public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'DataServiceError';
	}
}

export class DataMapperService implements IDataMapperService {
	private readonly dataReaderService : IDataReaderService;

	constructor(dataReaderService : IDataReaderService) {
		this.dataReaderService = dataReaderService;
	}

	async getAvailableOutputs(params : RouteParams) : Promise<AvailableOutputsResponse> {
		const rawData = await this.dataReaderService.getOutputsJSON(params);

		return [
			...rawData.metals
			          .filter(metal => metal.producible !== false)
			          .map(metal => ({
				          name : metal.name,
				          type : SmeltingOutputType.METAL
			          })),
			...rawData.alloys
			          .filter(alloy => alloy.producible !== false)
			          .map(alloy => ({
				          name : alloy.name,
				          type : SmeltingOutputType.ALLOY
			          }))
		];
	}

	async getOutputData(params: RouteParams, outputName: string): Promise<OutputDataResponse> {
		const rawOutputData = await this.dataReaderService.getOutputsJSON(params);

		const lowerOutputName = outputName.toLowerCase();
		const constants = await this.retrieveConstants(params);

		if (!constants) {
			throw new DataServiceError(
				404,
				`Failed to find constants for version!`
			);
		}

		// Try to find in metals
		const metal = rawOutputData.metals
			.filter(m => m.producible !== false)
			.find(m => m.name.toLowerCase() === lowerOutputName);
		if (metal) {
			const smeltingOutput: SmeltingOutput = {
				name: metal.name,
				components: [
					{
						mineral: metal.name,
						min: 100,
						max: 100
					}
				],
				producible: metal.producible ?? true,
				type: SmeltingOutputType.METAL,
				default: metal.default
			};

			return {
				components: smeltingOutput.components,
				minerals: await this.getMineralsForOutput(params, smeltingOutput, constants)
			};
		}

		// Try to find in alloys
		const alloy = rawOutputData.alloys
			.filter(a => a.producible !== false)
			.find(a => a.name.toLowerCase() === lowerOutputName);
		if (alloy) {
			const smeltingOutput: SmeltingOutput = {
				name: alloy.name,
				components: alloy.components ?? [],
				producible: alloy.producible ?? true,
				type: SmeltingOutputType.ALLOY,
				default: alloy.default
			};

			return {
				components: smeltingOutput.components,
				minerals: await this.getMineralsForOutput(params, smeltingOutput, constants)
			};
		}

		throw new DataServiceError(
			404,
			`Output ${outputName} not found!`
		);
	}

	private async retrieveConstants(
			params : RouteParams,
	) : Promise<Record<string, number> | null> {
		const rawGameVersionData = await this.dataReaderService.getGameVersionsJSON();

		const versionsSplit = params.version.split("_", 2);

		const resource = rawGameVersionData[params.type]
				.filter(r => r.supported)
				.filter(r => r.id == params.id)
				.filter(r => r.gameVersion == versionsSplit[0])
				.find(r => r.version == versionsSplit[1]);

		if (!resource?.constants) {
			return null;
		}

		return resource.constants;
	}

	private async getMineralsForOutput(
			params : RouteParams,
			output : SmeltingOutput,
			constants : Record<string, number>
	) : Promise<Map<string, Mineral[]>> {
		const minerals = await this.dataReaderService.getMineralsJSON(params);
		const isAlloy = output.type == SmeltingOutputType.ALLOY;
		const combinedMinerals = new Map<string, Mineral[]>();
		const missingMinerals : string[] = [];

		// For metals, use the output name directly
		// For alloys, iterate through components
		const mineralNames = isAlloy
			? output.components.map(component => component.mineral.toLowerCase())
			: [output.name.toLowerCase()];

		// Collect missing minerals
		for (const mineralName of mineralNames) {
			const foundMinerals = minerals[mineralName];
			if (!foundMinerals) {
				missingMinerals.push(mineralName);
				continue;
			}

			// Supply produces mineral for FE compliance
			const mineralsWithProduces = foundMinerals.map(mineral => ({
				...mineral,
				produces : mineralName
			}));
			combinedMinerals.set(mineralName, mineralsWithProduces);
		}

		// Warn on missing minerals
		if (missingMinerals.length > 0) {
			const message = isAlloy
				? `No minerals found for alloy ${output.name} with missing components: ${missingMinerals.join(', ')}`
				: `No minerals found for metal ${output.name}`;

			console.warn(message);
		}

		// Add default minerals based on constants
		for (const mineralName of mineralNames) {
			const mineralDefaults = await this.getMineralDefaults(params, mineralName);
			const defaultMinerals: Mineral[] = [];

			for (const defaultName of mineralDefaults) {
				const defaultYield = constants[defaultName];
				if (defaultYield !== undefined) {
					const name = replaceUnderscoreWithSpace(mineralName);

					defaultMinerals.push({
						name: capitaliseFirstLetterOfEachWord(`${name} ${defaultName}`),
						produces: mineralName,
						yield: defaultYield
					});
				}
			}

			// Add default minerals to existing minerals
			const existingMinerals = combinedMinerals.get(mineralName) || [];
			combinedMinerals.set(mineralName, [...existingMinerals, ...defaultMinerals]);
		}

		// Error on no minerals at all for component
		for (const mineral in missingMinerals) {
			if (combinedMinerals.get(mineral)?.length == 0) {
				const errorMessage = isAlloy
					? `No minerals found for alloy ${output.name} with missing components: ${missingMinerals.join(', ')}`
					: `No minerals found for metal ${output.name}`;

				throw new DataServiceError(404, errorMessage);
			}
		}

		return combinedMinerals;
	}

	private async getMineralDefaults(
			params: RouteParams,
			mineralName: string
	): Promise<string[]> {
		const outputs = await this.dataReaderService.getOutputsJSON(params);

		// Check in metals
		const metal = outputs
				.metals
				?.find(m => m.name.toLowerCase() === mineralName.toLowerCase());
		if (metal?.default) {
			return metal.default;
		}

		// Check in alloys
		const alloy = outputs
				.alloys
				?.find(a => a.name.toLowerCase() === mineralName.toLowerCase());
		if (alloy?.default) {
			return alloy.default;
		}

		return [];
	}
}
