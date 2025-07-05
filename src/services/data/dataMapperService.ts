import {RouteParams} from "@/types/gameversions";
import {InputMineral, SmeltingComponent, SmeltingOutput, SmeltingOutputType} from "@/types";
import {IDataReaderService} from "@/services/data/dataReaderService";


interface AvailableOutput {
	name: string;
	type: SmeltingOutputType;
}

export type AvailableOutputsResponse = AvailableOutput[];

export interface OutputDataResponse {
	components : SmeltingComponent[];
	minerals : Map<string, InputMineral[]>;
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
		const rawData = await this.dataReaderService.getOutputsJSON(params);
		const lowerOutputName = outputName.toLowerCase();

		// Try to find in metals
		const metal = rawData.metals
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
				minerals: await this.getMineralsForOutput(params, smeltingOutput)
			};
		}

		// Try to find in alloys
		const alloy = rawData.alloys
		                     .filter(a => a.producible !== false)
		                     .find(a => a.name.toLowerCase() === lowerOutputName);
		if (alloy && alloy.producible !== false) {
			const smeltingOutput: SmeltingOutput = {
				name: alloy.name,
				components: alloy.components ?? [],
				producible: alloy.producible ?? true,
				type: SmeltingOutputType.ALLOY,
				default: alloy.default
			};

			return {
				components: smeltingOutput.components,
				minerals: await this.getMineralsForOutput(params, smeltingOutput)
			};
		}

		throw new DataServiceError(
			404,
			`Output ${outputName} not found!`
		);
	}

	private async getMineralsForOutput(params: RouteParams, output: SmeltingOutput): Promise<Map<string, InputMineral[]>> {
		const minerals = await this.dataReaderService.getMineralsJSON(params);
		const isAlloy = output.type == SmeltingOutputType.ALLOY;
		const combinedMinerals = new Map<string, InputMineral[]>();
		const missingMinerals: string[] = [];

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
			} else {
				combinedMinerals.set(mineralName, foundMinerals);
			}
		}

		// Fail if missing minerals
		if (missingMinerals.length > 0) {
			const errorMessage = isAlloy
				? `No minerals found for alloy ${output.name} with missing components: ${missingMinerals.join(', ')}`
				: `No minerals found for metal ${output.name}`;

			throw new DataServiceError(404, errorMessage);
		}

		return combinedMinerals;
	}
}
