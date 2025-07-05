export interface SmeltingOutput {
	name : string;
	components : SmeltingComponent[];
	producible? : boolean;
	type : SmeltingOutputType;
	default? : string[];
}

export enum SmeltingOutputType {
	METAL,
	ALLOY
}

export interface SmeltingComponent {
	mineral : string;
	min : number;
	max : number;
}

export interface InputMineral {
	name : string;
	produces : string;
	yield : number;
	uses? : MineralUseCase[];
}

export interface QuantifiedInputMineral extends InputMineral {
	quantity : number;
}

export enum MineralUseCase {
	Vessel = "vessel",
	Crucible = "crucible",
	Bloomery = "bloomery",
	BlastFurnace = "blast_furnace"
}

export enum DesiredOutputTypes {
	Ingot = "ingot",
	Nugget = "nugget",
	Millibucket = "millibucket"
}
