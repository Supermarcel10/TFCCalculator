import {GameVersions, RouteParams} from "@/types/gameversions";
import path from "path";
import {promises as fs} from "fs";
import {InputMineral, SmeltingOutput} from "@/types";


// TODO: Look into making outputs.json more streamlined to prevent double the work in a lot of these cases
interface OutputJSON {
	metals : SmeltingOutput[];
	alloys : SmeltingOutput[];
}

interface MineralsJSON {
	[outputName: string]: InputMineral[];
}

export interface IDataReaderService {
	getGameVersionsJSON() : Promise<GameVersions>;
	getOutputsJSON(params : RouteParams) : Promise<OutputJSON>;
	getMineralsJSON(params : RouteParams) : Promise<MineralsJSON>
}

export class DataReaderService implements IDataReaderService {
	private static readonly MAIN_PATH = path.join(process.cwd(), "src", "data");
	private static readonly READ_OPTIONS = "utf-8";

	private static readonly GAME_VERSIONS_FILE_NAME : string = "gameversions.json";
	private static readonly OUTPUT_FILE_NAME : string = "outputs.json";
	private static readonly MINERALS_FILE_NAME : string = "minerals.json";


	async getGameVersionsJSON() : Promise<GameVersions> {
		const filePath = path.join(
				DataReaderService.MAIN_PATH,
				DataReaderService.GAME_VERSIONS_FILE_NAME
		);

		return fs.readFile(filePath, DataReaderService.READ_OPTIONS).then(JSON.parse);
	}

	async getOutputsJSON(params : RouteParams) : Promise<OutputJSON> {
		const filePath = path.join(
				DataReaderService.MAIN_PATH,
				params.type,
				params.id,
				params.version,
				DataReaderService.OUTPUT_FILE_NAME
		);

		return fs.readFile(filePath, DataReaderService.READ_OPTIONS).then(JSON.parse);
	}

	async getMineralsJSON(params : RouteParams) : Promise<MineralsJSON> {
		const filePath = path.join(
				DataReaderService.MAIN_PATH,
				params.type,
				params.id,
				params.version,
				DataReaderService.MINERALS_FILE_NAME
		);

		return fs.readFile(filePath, DataReaderService.READ_OPTIONS).then(JSON.parse);
	}
}
