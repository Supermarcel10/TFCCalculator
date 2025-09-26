// src/app/[type]/[id]/[version]/metals/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { SmeltingOutput } from "@/types";
import ClientMetalsPage from "./ClientMetalsPage";

type Props = {
	params: Promise<{ type: string; id: string; version: string }>;
};

export default async function Page({ params }: Props) {
	const { type, id, version } = await params;

	// Decodificar versión porque Next encodea "+" como %252B
	const safeVersion = decodeURIComponent(version);

	// Detectar host dinámicamente
	const headersList = await headers();
	const host = headersList.get("host") ?? "localhost:3000";
	const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
	const base = `${protocol}://${host}`;

	const res = await fetch(
		`${base}/api/${encodeURIComponent(type)}/${encodeURIComponent(id)}/${encodeURIComponent(safeVersion)}/metal`,
		{ cache: "no-store" }
	);

	if (!res.ok) return notFound();

	const data: SmeltingOutput[] = await res.json();
	if (!data || data.length === 0) return notFound();

	return <ClientMetalsPage initialData={data} params={{ type, id, version }} />;
}
