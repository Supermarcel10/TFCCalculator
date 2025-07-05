import {NextResponse} from "next/server";
import {RouteParams, VersionType} from "@/types/gameversions";
import {DataMapperService, DataServiceError} from "@/services/data/dataMapperService";
import {DataReaderService} from "@/services/data/dataReaderService";


interface RouteContext {
	params : Promise<{
		type : VersionType;
		id : string;
		version : string;
	}>;
}

export async function GET(
		_ : Request,
		context : RouteContext
) {
	const {type, id, version} = await context.params;

	try {
		const dataMapperService = new DataMapperService(new DataReaderService());
		return NextResponse.json(await dataMapperService.getAvailableOutputs({type, id, version}));
	} catch (error) {
		if (error && error instanceof DataServiceError) {
			console.error(`${error.message}: ${error.originalError}`);
			return NextResponse.json(
				{message : error.message},
				{status : error.status}
			);
		}

		console.error(`Failed to fetch metals data: ${error}`);
		return NextResponse.json(
				{error : "Failed to fetch metals data"},
				{status : 500}
		);
	}
}