import type {SmeltingComponent} from "@/types";


export function bronzeComponents() : SmeltingComponent[] {
	return [
		{mineral : "copper", min : 88, max : 92},
		{mineral : "tin", min : 8, max : 12}
	];
}
