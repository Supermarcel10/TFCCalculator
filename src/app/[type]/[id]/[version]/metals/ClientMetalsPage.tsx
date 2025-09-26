"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SmeltingOutput, SmeltingOutputType } from "@/types";
import { HeadingWithBackButton } from "@/components/HeadingWithBackButton";
import { SelfCenteringGrid } from "@/components/SelfCenteringGrid";
import { capitaliseFirstLetterOfEachWord } from "@/functions/utils";
import { FilterBar } from "@/components/FilterBar";
import { CreationSelectionFilter } from "@/types/filters";
import { KeyReturnIcon } from "@phosphor-icons/react";
import { hasPhysicalKeyboard } from "@/functions/keyboardDetection";

type Props = {
    initialData: SmeltingOutput[];
    params: { type: string; id: string; version: string };
};

export default function ClientMetalsPage({ initialData, params }: Props) {
    const { type, id, version } = params;
    const router = useRouter();

    const [filteredResult, setFilteredResult] = useState<SmeltingOutput[]>(initialData);
    const [filterType, setFilterType] = useState<CreationSelectionFilter>(CreationSelectionFilter.All);
    const [searchTerm, setSearchTerm] = useState("");

    const handleMetalSelect = useCallback(
        (metal: SmeltingOutput) => {
            router.push(`/${type}/${id}/${version}/${encodeURIComponent(metal.name)}`);
        },
        [router, type, id, version]
    );

    // safe decode para evitar errores de URI
    let decodedId = id;
    let decodedVersion = version;
    try {
        decodedId = decodeURIComponent(id);
        decodedVersion = decodeURIComponent(version);
    } catch { }
    const versionsSplit = decodedVersion.split("_", 2);
    const subheadingString = `${decodedId} ${versionsSplit[1] ?? ""}`;

    // aplicar filtros
    useEffect(() => {
        let result = initialData.slice();

        if (filterType !== CreationSelectionFilter.All) {
            result = result.filter((s) =>
                filterType === CreationSelectionFilter.Metals
                    ? s.type === SmeltingOutputType.METAL
                    : s.type === SmeltingOutputType.ALLOY
            );
        }

        if (searchTerm) {
            const lowercaseSearch = searchTerm.toLowerCase();
            result = result.filter((m) => m.name.toLowerCase().includes(lowercaseSearch));
        }

        setFilteredResult(result);
    }, [initialData, filterType, searchTerm]);

    // tecla Enter si hay 1 resultado
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "Enter" && filteredResult.length === 1) {
                event.preventDefault();
                handleMetalSelect(filteredResult[0]);
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, [filteredResult, handleMetalSelect]);

    const renderMetalButton = useCallback(
        (metal: SmeltingOutput) => {
            const displayMetalName = capitaliseFirstLetterOfEachWord(metal.name);

            return (
                <button
                    key={metal.name}
                    className="w-full aspect-square flex flex-col items-center justify-center p-4 rounded-lg shadow-md
            bg-teal-100 hover:bg-teal-200 transition-colors duration-200 relative"
                    onClick={() => handleMetalSelect(metal)}
                    aria-label={`Select ${displayMetalName} metal`}
                >
                    <span className="text-center text-black text-lg font-bold">{displayMetalName}</span>

                    {filteredResult.length === 1 && hasPhysicalKeyboard() && (
                        <div className="absolute top-2 right-2 flex items-center justify-center transition-transform">
                            <kbd className="border-blue-500 bg-white border pt-0.5 pb-0.5 p-1 rounded">
                                <KeyReturnIcon size={24} weight="bold" className="text-black" aria-hidden="true" />
                            </kbd>
                        </div>
                    )}
                </button>
            );
        },
        [handleMetalSelect, filteredResult.length]
    );

    return (
        <main className="container mx-auto px-4 py-8" role="main" aria-label="Metal Selection">
            <div className="max-w-6xl mx-auto">
                <HeadingWithBackButton
                    title="CHOOSE TARGET OUTPUT"
                    subheading={subheadingString}
                    ariaPreviousScreenName="home"
                    handleBackURI="/"
                />

                <FilterBar
                    filterOptions={Object.values(CreationSelectionFilter)
                        .filter((v) => typeof v === "number")
                        .map((v) => ({ value: v as CreationSelectionFilter, label: CreationSelectionFilter[v as any] }))}
                    filterType={filterType}
                    searchTerm={searchTerm}
                    onFilterTypeChange={setFilterType}
                    onSearchTermChange={setSearchTerm}
                />

                {filteredResult.length > 0 ? (
                    <SelfCenteringGrid
                        elements={filteredResult}
                        perRow={{ default: 2, sm: 3, md: 4, lg: 5 }}
                        renderElement={renderMetalButton}
                    />
                ) : (
                    <p className="text-center text-teal-100 mt-4">No metals available for this selection.</p>
                )}
            </div>
        </main>
    );
}