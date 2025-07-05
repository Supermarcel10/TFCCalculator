import {InputMineral, MineralUseCase, SmeltingComponent} from "@/types";
import {NextResponse} from "next/server";
import {RouteParams} from "@/types/gameversions";
import {DataMapperService, DataServiceError} from "@/services/data/dataMapperService";
import {DataReaderService} from "@/services/data/dataReaderService";


export interface ApiResponse {
	components : SmeltingComponent[];
	minerals : Map<string, InputMineral[]>;
}

interface RouteContext {
	params : Promise<RouteParams & {
		metal : string;
	}>;
}

export async function GET(
		request : Request,
		{params} : RouteContext,
) {
	const {metal, type, id, version} = await params;
	const {searchParams} = new URL(request.url);
	const uses = searchParams.getAll("uses").map(use => use as MineralUseCase);
	const decodedMetal = decodeURIComponent(metal).toLowerCase();

	try {
		const dataMapperService = new DataMapperService(new DataReaderService());
		const response = await dataMapperService.getOutputData({type, id, version}, decodedMetal);
		const filteredMinerals = filterMineralsByUses(response.minerals, uses);

		return NextResponse.json(
				{
					components : response.components,
					minerals : Object.fromEntries(filteredMinerals)
				});
	} catch (error) {
		if (error && error instanceof DataServiceError) {
			console.error(`${error.message}: ${error.originalError}`);
			return NextResponse.json(
					{message : error.message},
					{status : error.status}
			);
		}

		console.error(`Unknown failure to fetch ${decodedMetal}: ${error}`);
		return NextResponse.json(
				{error : `Unknown failure to fetch ${decodedMetal}: ${error}`,},
				{status : 500}
		);
	}
}

/**
 * Filters minerals based on their use cases using non-exclusive OR.
 * Returns true if no uses are specified or if the mineral has any of the specified uses.
 * @param minerals The map of InputMinerals to filter
 * @param uses Array of MineralUseCase to filter by
 * @returns Filtered map of InputMinerals
 */
function filterMineralsByUses(minerals : Map<string, InputMineral[]>, uses : MineralUseCase[]) : Map<string, InputMineral[]> {
	if (uses.length === 0) {
		return minerals;
	}

	minerals.forEach((component, key) => {
		minerals.set(key, component.filter(mineral => uses.some(use => mineral.uses?.includes(use))));
	});

	return minerals;
}