import {cache} from "react";
import {RouteParams} from "@/types/gameversions";
import {AlloyOutput, InputMineral, isAlloyOutput, MetalOutput, SmeltingOutput} from "@/types";
import {promises as fs} from "fs";
import path from "path";


interface RawMineralsJson {
	[mineralName : string] : InputMineral[];
}

interface MetalsListResponse {
	metals : MetalOutput[];
	alloys : AlloyOutput[];
}

export interface OutputResponse {
	material : SmeltingOutput;
	minerals : Map<string, InputMineral[]>;
}

export class DataService {
	private constructor(
			private dataPath : string
	) {}

	static async initialize(params : RouteParams) : Promise<DataService> {
		const dataPath = path.join(process.cwd(), "src", "data", params.type, params.id, params.version);
		return new DataService(dataPath);
	}

	async getOutputs() : Promise<SmeltingOutput[]> {
		try {
			const filePath = path.join(this.dataPath, "outputs.json");
			const fileContent = await fs.readFile(filePath, "utf-8");
			const rawData : MetalsListResponse = JSON.parse(fileContent);

			return [
				...rawData.metals.map(metal => ({
					name : metal.name,
					components : [
						{
							mineral : metal.name,
							min : 100,
							max : 100
						}
					],
					producible : metal.producible ?? true
				} as MetalOutput)),
				...rawData.alloys.map(alloy => ({
					name : alloy.name,
					components : alloy.components ?? [],
					producible : alloy.producible ?? true
				} as AlloyOutput))
			];
		} catch (error) {
			throw {
				status : 500,
				message : `Failed to load outputs from ${this.dataPath}`,
				error
			};
		}
	}

	async getOutput(outputName : string) : Promise<OutputResponse> {
		try {
			const outputs = await this.getOutputs();

			const smeltingOutput = outputs.find(
					(output : SmeltingOutput) => output.name.toLowerCase() === outputName.toLowerCase()
			) || null;

			if (smeltingOutput) {
				return {
					material : smeltingOutput,
					minerals : await this.getMineralsForOutput(smeltingOutput)
				};
			}
		} catch (error) {
			throw {
				status : 500,
				message : `Failed to load output ${outputName} for ${this.dataPath}`,
				error
			};
		}

		throw {
			status : 404,
			message : `Output ${outputName} not found!`
		};
	}

	private async getMineralsForOutput(output : SmeltingOutput) : Promise<Map<string, InputMineral[]>> {
		const minerals = await this.loadMinerals();

		return isAlloyOutput(output)
		       ? this.getMineralsForAlloy(output, minerals)
		       : this.getMineralsForMetal(output as MetalOutput, minerals);
	}

	private async getMineralsForMetal(metal : MetalOutput, minerals : RawMineralsJson) : Promise<Map<string, InputMineral[]>> {
		const metalMinerals = minerals[metal.name.toLowerCase()];
		if (!metalMinerals) {
			throw {
				status : 404,
				message : `No minerals found for ${metal.name}!`
			};
		}

		return new Map<string, InputMineral[]>([[metal.name, metalMinerals]]);
	}

	private async getMineralsForAlloy(alloy : AlloyOutput, minerals : RawMineralsJson) : Promise<Map<string, InputMineral[]>> {
		const combinedMinerals = new Map<string, InputMineral[]>;

		alloy.components.forEach(component => {
			const componentMinerals = minerals[component.mineral.toLowerCase()];
			if (!componentMinerals) {
				throw {
					status : 404,
					message : `No minerals found for ${alloy.name} with name ${component.mineral}!`
				};
			}

			combinedMinerals.set(component.mineral.toLowerCase(), componentMinerals);
		});

		return combinedMinerals;
	}

	private async loadMinerals() : Promise<RawMineralsJson> {
		try {
			const filePath = path.join(this.dataPath, "minerals.json");
			const fileContent = await fs.readFile(filePath, "utf-8");
			return JSON.parse(fileContent);
		} catch (error) {
			throw {
				status : 500,
				message : `Failed to load minerals from ${this.dataPath}`,
				error
			};
		}
	}
}

export const getDataService = cache(async(params : RouteParams) : Promise<DataService> => {
	if (!params.type || !params.id || !params.version) {
		throw {
			status : 400,
			message : "Missing required parameters: type, id, and version are required"
		};
	}

	return DataService.initialize(params);
});