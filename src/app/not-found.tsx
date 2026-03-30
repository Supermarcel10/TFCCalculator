"use client";

import Image from "next/image";
import { useRouteError } from "@/functions/errorPage";

const ogImage = {
    url: "/api/og",
    width: 1200,
    height: 630,
    alt: "TFC Metal Calculator Cover",
};

export default function GlobalNotFound() {
    const { error,
        goBack,
        showReport,
        toggleReport,
        reportText,
        handleReportChange,
        handleSubmitReport
    } = useRouteError();

    return (
        <main className="flex flex-col items-center h-screen text-center py-8 px-2 gap-16">
            <h1 className="text-3xl font-bold text-red-600 mb-8">
                404 - Page Not Found
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center max-w-5xl w-full">
                <div className="flex flex-col items-start text-left space-y-4">
                    {error.missingParams.length > 0 && (
                        <ul className="text-sm text-yellow-500 space-y-1">
                            {error.missingParams.map((param) => (
                                <li key={param}>
                                    Missing <strong>{param}</strong> in the URL
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex flex-row gap-4">
                        <button
                            onClick={goBack}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Go Back
                        </button>

                        <button
                            onClick={toggleReport}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                            Report Error
                        </button>
                    </div>

                    {showReport && (
                        <div className="mt-4 w-full border border-red-500 rounded-lg p-4 bg-red-50 text-left">
                            <h2 className="font-semibold text-red-700 mb-2">Report an Issue</h2>
                            <textarea
                                value={reportText}
                                onChange={(e) => handleReportChange(e.target.value)}
                                placeholder="Describe the problem..."
                                className="w-full h-24 p-2 border rounded resize-none text-black"
                            />

                            <button
                                onClick={handleSubmitReport}
                                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                            >
                                Submit Report
                            </button>

                        </div>
                    )}
                </div>

                <div className="flex justify-center w-80">
                    <Image
                        src={ogImage.url}
                        alt={ogImage.alt}
                        width={ogImage.width / 2}
                        height={ogImage.height / 2}
                        className="rounded-lg shadow-md"
                        priority
                    />
                </div>
            </div>
        </main>
    );
}
